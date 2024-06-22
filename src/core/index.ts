import Ajv from "ajv";
import { ChildProcess, spawn } from "child_process";
import { cosmiconfigSync } from "cosmiconfig";
import makeDebug from "debug";
import { existsSync } from "fs";
import path from "path";
import { hideBin } from "yargs/helpers";

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

// Build our extensions catalog
interface ExtensionDefinition {
  extension: ExtensionStr;
  runtime: string | null;
}

function makeExtension(extension: ExtensionStr): ExtensionDefinition {
  return {
    extension,
    runtime: config.launcher?.[extension] ?? null,
  };
}

const EXTENSIONS: readonly ExtensionDefinition[] = [
  makeExtension(".js"),
  makeExtension(".cjs"),
  makeExtension(".mjs"),
  makeExtension(".ts"),
];

EXTENSIONS.forEach(({ extension, runtime }): void => {
  debug(
    `Extension: '${extension}'`,
    runtime ? `(runtime: \`${runtime}\`)` : undefined,
  );
});

// Locate the right script to run
function runScript(): ChildProcess | null {
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

    for (const { extension, runtime } of EXTENSIONS) {
      const filename = filenameNoExt + extension;
      debug("Considering:", filename);
      if (existsSync(filename)) {
        debug("Found:", filename);
        const positionalArgs = [...positionalArgsStack].reverse();
        debug("Args:", positionalArgs);

        const spawnCommand = runtime ?? process.argv[0];
        debug("Spawn command:", spawnCommand);
        const spawnArgs = [filename, ...positionalArgs];
        debug("Spawn args:", spawnArgs);
        // TODO: Pass in something to cause it to trigger main() function?
        const child = spawn(spawnCommand, spawnArgs, { stdio: "inherit" });
        debug("Child PID:", child.pid);
        return child;
      }
    }

    moveArg();
  }

  return null;
}

const child = runScript();
if (child) {
  child.on("exit", (code) => {
    debug("Child returned code", code);
    process.exit(code);
  });
} else {
  console.error("Unable to find script!");
  process.exit(1);
}
