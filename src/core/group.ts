import makeDebug from "debug";
import { readdirSync } from "fs";
import path from "path";
import crossImport from "cross-import";
import Runnable, { RunArguments } from "./runnable";

const debug = makeDebug("espresso:group");

class Group extends Runnable {
  public async run({
    cliRootDirectory,
    ownFilename,
  }: RunArguments): Promise<number> {
    const children = this.getChildren(cliRootDirectory, ownFilename);
    debug(
      "children:",
      children.map((child) => child.name),
    );

    console.log("help message for", this.name); // TODO

    return 0;
  }

  private getChildren(
    cliRootDirectory: string,
    ownFilename: string,
  ): readonly Runnable[] {
    const filenames = this.getFilenamesToImport(cliRootDirectory, ownFilename);
    debug("Filenames to import:", filenames);

    const children: Runnable[] = [];
    filenames.forEach((filename): void => {
      const runnable = this.importRunnable(filename);
      if (!runnable) {
        return;
      }

      if (!runnable.isChildOf(this)) {
        debug(`'${filename}' runnable is not a child of this group`);
        return;
      }

      children.push(runnable);
    });

    return children;
  }

  private getFilenamesToImport(
    cliRootDirectory: string,
    ownFilename: string,
  ): readonly string[] {
    const filenamePrefix = path.parse(ownFilename).name + "-";
    debug("Filename prefix to match:", filenamePrefix);
    return readdirSync(cliRootDirectory)
      .filter((filename): boolean => filename.startsWith(filenamePrefix))
      .map((name) => path.resolve(cliRootDirectory, name));
  }

  private importRunnable(filename: string): Runnable | null {
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

    if (!Runnable.is(importedModule.default)) {
      debug(`Default export for '${filename}' not a Runnable`);
      return null;
    }

    return importedModule.default;
  }
}

export default Group;
