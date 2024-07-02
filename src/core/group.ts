import chalk from "chalk";
import makeDebug from "debug";
import Runnable, { RunArguments } from "./runnable";
import { hasHelpFlag } from "./flag";
import FilesystemManager from "./filesystem-manager";
import { Output } from "./output";

const debug = makeDebug("espresso:group");

class Group extends Runnable {
  public async run({
    filesystem,
    flags,
    positional,
    output,
  }: RunArguments): Promise<number> {
    debug("name:", this.name);
    // Help flags take priority
    if (hasHelpFlag(flags)) {
      debug("Help flag present");
      this.printHelpMessage(filesystem, output);
      return 0;
    }

    // Check to see if there's a default action for this group
    // This is the action to be run if the group is directly invoked
    const defaultFile = filesystem.getFile(this.name.default());
    if (defaultFile) {
      const runnable = defaultFile.import();
      if (!runnable) {
        console.error(
          "Command has a default action, but doesn't export a Runnable as the default export",
        );
        return 1;
      }

      return runnable.run({ filesystem, output, flags, positional });
    }

    // This group doesn't perform any action when invoked, so print out
    // the help message to facilitate navigation.
    this.printHelpMessage(filesystem, output);
    return 0;
  }

  private printHelpMessage(
    filesystem: FilesystemManager,
    output: Output,
  ): void {
    const children = this.getChildren(filesystem);
    debug(
      "children:",
      children.map((child) => child.name),
    );

    output.writeLine(`Usage: ${this.name.toString()}`);
    if (children.length) {
      output.writeLine("  Subcommands:");
      children.forEach((child) => {
        output.writeLine(`    ${child.name}`);
      });
    }
  }

  private getChildren(filesystem: FilesystemManager): readonly Runnable[] {
    const files = filesystem.findAllChildren(this.name);
    debug(
      "Filenames to import:",
      files.map((file) => file.filename),
    );

    const children: Runnable[] = [];
    files.forEach((file): void => {
      const runnable = file.import();
      if (!runnable) {
        return;
      }

      if (!runnable.name.isChildOf(this.name)) {
        debug(`'${file.filename}' runnable is not a child of this group`);
        return;
      }

      children.push(runnable);
    });

    return children;
  }
}

export default Group;