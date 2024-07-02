import FilesystemManager from "./filesystem-manager";
import Name from "./name";
import { Output } from "./output";

export interface RunArguments {
  filesystem: FilesystemManager;
  output: Output;
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

    if (!("name" in obj) || typeof obj.name !== "object") {
      return false;
    }

    return true;
  }

  protected constructor(public readonly name: Name) {}

  public abstract run(args: RunArguments): Promise<number>;
}

export default Runnable;
