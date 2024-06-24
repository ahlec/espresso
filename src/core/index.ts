import Ajv from "ajv";
import { cosmiconfigSync } from "cosmiconfig";
import crossImport from "cross-import";
import makeDebug from "debug";
import { existsSync } from "fs";
import path from "path";
import { hideBin } from "yargs/helpers";
import Entrypoint from "./entrypoint";

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
  args: readonly string[];
}

const EXTENSIONS: readonly ExtensionStr[] = [".js", ".cjs", ".mjs", ".ts"];

function importScript(): ImportScript | null {
  const positionalArgsStack: string[] = [];
  const possibleArgs: string[] = cliArgsRaw.map((el) => String(el));

  const moveArg = (): void => {
    const arg = possibleArgs.pop();
    if (arg) {
      positionalArgsStack.push(arg);
    }
  };

  while (possibleArgs.length) {
    if (possibleArgs[possibleArgs.length - 1].startsWith("-")) {
      // This is a flag or option, so we'll skip over this
      debug(`Skipping flag/option '${possibleArgs[possibleArgs.length - 1]}'`);
      moveArg();
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

        const relativeFilename = "./" + path.relative(process.cwd(), filename);
        debug("Relative filename:", relativeFilename);
        return {
          filename,
          module: crossImport(filename),
          args: positionalArgs,
        };
      }
    }

    moveArg();
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
if (Entrypoint.is(defaultExport)) {
  debug("Running entrypoint for", script.filename);
  const exitCode = await defaultExport.run();
  debug("Command exit code:", exitCode);
  process.exitCode = exitCode;
} else {
  console.error(
    `Unrecognized/unsupported default export in file '${script.filename}'`,
  );
  process.exit(0);
}
