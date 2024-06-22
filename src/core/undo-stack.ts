type UndoFn = () => void | Promise<void>;

class UndoStack {
  private stack: UndoFn[] = [];
  private hasPerformed = false;

  public push(fn: UndoFn) {
    if (this.hasPerformed) {
      throw new Error("Has already run the UndoStack!");
    }

    this.stack.push(fn);
  }

  public undo(): Promise<void> {
    if (this.hasPerformed) {
      throw new Error("Has already run the UndoStack!");
    }

    this.hasPerformed = true;

    return this.stack.reduceRight<Promise<void>>(
      (prev, curr) => prev.then(() => curr()),
      Promise.resolve(),
    );
  }
}

export default UndoStack;
