import Ajv from "ajv";
import { cosmiconfigSync } from "cosmiconfig";
import crossImport from "cross-import";
import makeDebug from "debug";
import { existsSync } from "fs";
import path from "path";
import { hideBin } from "yargs/helpers";
import Runnable from "./runnable";

const debug = makeDebug("espresso:entrypoint");

const [cliRootRelative, ...cliArgsRaw] = hideBin(process.argv);

type ExtensionStr = `.${string}`;

// Validate the CLI root
const cliRoot = path.resolve(String(cliRootRelative));
debug("CLI root:", cliRoot);
if (!existsSync(cliRoot)) {
  console.error(`Root of CLI directory '${cliRoot}' does not exist.`);
  process.exit(1);
}

/**
 * TODO: Should config be found on the Program?
 * `espresso` takes the index.ts file -- the root of the Program.
 * Expects an export of Program.
 *
 * On the program is all of the config, as options. It allows for
 * customizing behavior, AND it reduces the total amount of config.
 */

// Find our runtime config
const configExplorer = cosmiconfigSync("espresso");
const configResult = configExplorer.search(cliRoot);
if (!configResult) {
  console.error("Could not locate espresso configuration");
  process.exit(1);
}

debug("Config path:", configResult.filepath);

// Validate our config
interface Config {
  launcher?: Record<ExtensionStr, string | undefined>;
}
const validateConfig = new Ajv().compile<Config>({
  type: "object",
  properties: {
    launcher: {
      type: "object",
      patternProperties: {
        "^\\..+$": { type: "string" },
      },
      additionalProperties: false,
    },
  },
  additionalProperties: false,
});
if (!validateConfig(configResult.config)) {
  console.error("Config is invalid");
  console.error(validateConfig.errors);
  process.exit(1);
}

const { config } = configResult;

// Locate the right script to run
interface ImportScript {
  filename: string;
  module: unknown;
  positionalArgs: readonly string[];
  flags: Record<string, string | boolean | undefined>;
}

const EXTENSIONS: readonly ExtensionStr[] = [".js", ".cjs", ".mjs", ".ts"];

function parseFlag(
  full: string,
): readonly { flag: string; value: string | boolean | undefined }[] {
  const flagWithValueMatch = full.match(/^--([^=]+)=(.*)$/);
  if (flagWithValueMatch) {
    return [
      {
        flag: flagWithValueMatch[1],
        value: flagWithValueMatch[2],
      },
    ];
  }

  const dashDashFlagMatch = full.match(/^--(.+)$/);
  if (dashDashFlagMatch) {
    return [
      {
        flag: dashDashFlagMatch[1],
        value: true,
      },
    ];
  }

  const dashFlagMatch = full.match(/^-(.+)$/);
  if (dashFlagMatch) {
    // We explode this style of flag into multiple flags.
    // Consider `rm -rf` which is the same as `rm -r -f`
    const individualMatches = dashFlagMatch[1].match(/.{1}/g);
    return individualMatches?.map((flag) => ({ flag, value: true })) ?? [];
  }

  throw new Error(`Unable to parse flag '${full}'`);
}

function importScript(): ImportScript | null {
  const positionalArgsStack: string[] = [];
  const possibleArgs: string[] = cliArgsRaw.map((el) => String(el));
  const flags: Record<string, string | boolean | undefined> = {};

  while (possibleArgs.length) {
    if (possibleArgs[possibleArgs.length - 1].startsWith("-")) {
      // This is a flag or option, so we'll skip over this
      const fullFlag = possibleArgs[possibleArgs.length - 1];
      const parsed = parseFlag(fullFlag);
      debug(
        `Parsed '${fullFlag}' as ${parsed.length === 1 ? "flag" : "flags"} ${parsed.map(({ flag, value }) => `'${flag}' with value '${value}' (${typeof value})`).join(", ")}`,
      );
      parsed.forEach(({ flag, value }): void => {
        flags[flag] = value;
      });
      possibleArgs.pop();
      continue;
    }

    const filenameNoExt = path.resolve(cliRoot, possibleArgs.join("-"));

    for (const extension of EXTENSIONS) {
      const filename = filenameNoExt + extension;
      debug("Considering:", filename);
      if (existsSync(filename)) {
        debug("Found:", filename);
        const positionalArgs = [...positionalArgsStack].reverse();
        debug("Args:", positionalArgs);
        debug("Flags:", flags);

        const relativeFilename = "./" + path.relative(process.cwd(), filename);
        debug("Relative filename:", relativeFilename);
        return {
          filename,
          module: crossImport(filename),
          positionalArgs,
          flags,
        };
      }
    }

    const arg = possibleArgs.pop();
    if (arg) {
      positionalArgsStack.push(arg);
    }
  }

  return null;
}

const script = importScript();
if (!script) {
  console.error("Unable to find script!");
  process.exit(1);
}

// Get the default export for the script
let defaultExport: unknown;
if (
  typeof script.module === "object" &&
  script.module !== null &&
  "default" in script.module
) {
  defaultExport = script.module.default;
} else {
  console.error(`No default export in file '${script.filename}'`);
  process.exit(1);
}

// Run the default export
// TODO: This is because imported-from-TS Entrypoint != one from this context? Investigate.
if (Runnable.is(defaultExport)) {
  debug("Executing runnable for", script.filename);
  const exitCode = await defaultExport.run({
    cliRootDirectory: cliRoot,
    ownFilename: script.filename,
    flags: script.flags,
    positional: script.positionalArgs,
  });
  debug("Runnable exit code:", exitCode);
  process.exitCode = exitCode;
} else {
  console.error(
    `Unrecognized/unsupported default export in file '${script.filename}'`,
  );
  process.exit(0);
}
