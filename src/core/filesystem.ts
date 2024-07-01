import makeDebug from "debug";
import { existsSync, readdirSync } from "fs";
import path from "path";
import crossImport from "cross-import";
import Runnable from "./runnable";
import Name, { ReadonlyName } from "./name";

const debug = makeDebug("espresso:filesystem");

const EXTENSIONS: readonly string[] = [".js", ".cjs", ".mjs", ".ts"];

export interface EspressoFile {
  filename: string;
  import: () => Runnable | null;
}

class Filesystem {
  public constructor(private readonly cliRoot: string) {}

  public getFile(name: ReadonlyName): EspressoFile | null {
    let filenameNoExt = path.resolve(
      this.cliRoot,
      [...name.groups, name.self].join("-") || "index",
    );
    if (name.type === "group-default") {
      filenameNoExt += ".default";
    }

    for (const extension of EXTENSIONS) {
      const filename = filenameNoExt + extension;
      debug("Considering:", filename);
      if (existsSync(filename)) {
        debug("Found:", filename);
        return {
          filename,
          import: () => this.importDefaultRunnable(filename),
        };
      }
    }

    return null;
  }

  public findAllChildren(of: Name): readonly EspressoFile[] {
    let namePredicate: (name: string) => boolean;
    switch (of.type) {
      case "program": {
        namePredicate = (name) => name !== "index";
        break;
      }
      case "group":
      case "cli": {
        // Append a hyphen as well since we're looking for children
        // and excluding default actions
        const filenamePrefix = [...of.groups, of.self].join("-") + "-";
        debug("Filename prefix to match:", filenamePrefix);
        namePredicate = (name) => name.startsWith(filenamePrefix);
        break;
      }
      case "group-default": {
        // Default action files never have children
        return [];
      }
    }

    return readdirSync(this.cliRoot)
      .filter((filename): boolean => {
        const parsed = path.parse(filename);
        if (!EXTENSIONS.includes(parsed.ext)) {
          return false;
        }

        if (parsed.name.endsWith(".default")) {
          return false;
        }

        return namePredicate(parsed.name);
      })
      .map((name): EspressoFile => {
        const filename = path.resolve(this.cliRoot, name);
        return {
          filename,
          import: () => this.importDefaultRunnable(filename),
        };
      });
  }

  private importDefaultRunnable(filename: string): Runnable | null {
    let importedModule: unknown;
    try {
      importedModule = crossImport(filename);
    } catch (e) {
      debug(`Error importing '${filename}':`, e);
      return null;
    }

    if (typeof importedModule !== "object" || importedModule === null) {
      debug(`Import for '${filename}' was not an object`);
      return null;
    }

    if (!("default" in importedModule)) {
      debug(`No default export from module '${filename}'`);
      return null;
    }

    // TODO: This is because imported-from-TS Entrypoint != one from this context? Investigate.
    if (!Runnable.is(importedModule.default)) {
      debug(`Default export for '${filename}' not a Runnable`);
      return null;
    }

    return importedModule.default;
  }
}

export default Filesystem;
