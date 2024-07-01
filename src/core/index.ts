import makeDebug from "debug";
import { existsSync } from "fs";
import path from "path";
import { hideBin } from "yargs/helpers";
import Filesystem, { EspressoFile } from "./filesystem";
import NameImpl from "./name";

const debug = makeDebug("espresso:entrypoint");

const [cliRootRelative, ...cliArgsRaw] = hideBin(process.argv);

// Validate the CLI root
const cliRoot = path.resolve(String(cliRootRelative));
debug("CLI root:", cliRoot);
if (!existsSync(cliRoot)) {
  console.error(`Root of CLI directory '${cliRoot}' does not exist.`);
  process.exit(1);
}

const filesystem = new Filesystem(cliRoot);

// Locate the right script to run
interface ImportScript {
  file: EspressoFile;
  positionalArgs: readonly string[];
  flags: Record<string, string | boolean | undefined>;
}

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

    const file = filesystem.getFile(NameImpl.from("./demo", possibleArgs)); // TODO?
    if (file) {
      const positionalArgs = [...positionalArgsStack].reverse();
      debug("Args:", positionalArgs);
      debug("Flags:", flags);
      return {
        file,
        positionalArgs,
        flags,
      };
    }

    const arg = possibleArgs.pop();
    if (arg) {
      positionalArgsStack.push(arg);
    }
  }

  const programFile = filesystem.getFile(NameImpl.start("./demo")); // TODO?
  if (programFile) {
    const positionalArgs = [...positionalArgsStack].reverse();
    debug("Args:", positionalArgs);
    debug("Flags:", flags);
    return {
      file: programFile,
      positionalArgs,
      flags,
    };
  }

  return null;
}

const script = importScript();
if (!script) {
  console.error("Unable to find script!");
  process.exit(1);
}

// Run the default export
const runnable = script.file.import();
if (runnable) {
  debug("Executing runnable for", script.file.filename);
  const exitCode = await runnable.run({
    filesystem,
    flags: script.flags,
    positional: script.positionalArgs,
  });
  debug("Runnable exit code:", exitCode);
  process.exitCode = exitCode;
} else {
  console.error(
    `Unrecognized/unsupported default export in file '${script.file.filename}'`,
  );
  process.exit(0);
}
