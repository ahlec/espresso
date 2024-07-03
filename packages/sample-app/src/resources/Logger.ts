class Logger {
  public writeLine(...args: readonly string[]): void {
    console.log(...args);
  }
}

export default Logger;
