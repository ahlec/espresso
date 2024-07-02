export interface Output {
  writeLine(...str: readonly string[]): void;
}

export class ConsoleOutput implements Output {
  public writeLine(...str: readonly string[]): void {
    console.log(...str);
  }
}
