const INTERNAL_FLAG = "espresso.runnable";

export interface RunArguments {
  positional: readonly string[];
  flags: Record<string, unknown>;
}

abstract class Runnable {
  public static is(obj: unknown): obj is Runnable {
    if (typeof obj !== "object" || obj === null || Array.isArray(obj)) {
      return false;
    }

    return (
      "__internalFlag" in obj &&
      obj.__internalFlag === INTERNAL_FLAG &&
      "main" in obj &&
      typeof obj.main === "function" &&
      "run" in obj &&
      typeof obj.run === "function"
    );
  }

  private readonly __internalFlag = INTERNAL_FLAG;

  public abstract run(args: RunArguments): Promise<number>;
}

export default Runnable;
