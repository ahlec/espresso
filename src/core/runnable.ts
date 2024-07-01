export interface RunArguments {
  cliRootDirectory: string;
  ownFilename: string;
  positional: readonly string[];
  flags: Record<string, string | boolean | undefined>;
}

abstract class Runnable {
  public static is(obj: unknown): obj is Runnable {
    if (typeof obj !== "object" || obj === null || Array.isArray(obj)) {
      return false;
    }

    if (!("run" in obj) || typeof obj.run !== "function") {
      return false;
    }

    if (!("name" in obj) || typeof obj.name !== "string") {
      return false;
    }

    if (!("parentStack" in obj) || !Array.isArray(obj.parentStack)) {
      return false;
    }

    return true;
  }

  protected constructor(
    public readonly name: string,
    protected readonly parentStack: readonly string[],
  ) {}

  public isChildOf(parent: Runnable): boolean {
    if (this.parentStack.length !== parent.parentStack.length + 1) {
      return false;
    }

    for (let index = 0; index < parent.parentStack.length; ++index) {
      if (this.parentStack[index] !== parent.parentStack[index]) {
        return false;
      }
    }

    return this.parentStack[this.parentStack.length - 1] === parent.name;
  }

  public abstract run(args: RunArguments): Promise<number>;
}

export default Runnable;
