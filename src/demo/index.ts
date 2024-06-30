import Program from "@espresso/core/program";

export class Logger {
  public log(str: string): void {
    console.log("LOGGER:", str);
  }
}

export class Database {
  public async queryUserName(id: number): Promise<string | null> {
    if (id === 17) {
      return "Alec";
    }

    return null;
  }
}

export class Cache {
  private readonly id: number;
  private readonly data: Record<string, unknown> = {};

  public constructor(private readonly logger: Logger) {
    this.id = Math.random();
    this.logger.log(`creating cache! ${this.id}`);
  }

  public put(key: string, value: unknown): void {
    this.logger.log(`putting '${key}' into '${this.id}'`);
    this.data[key] = value;
  }

  public destroy(): void {
    this.logger.log(`destroying cache! ${this.id}`);
  }
}

const espresso = Program.start()
  .provide("logger", () => new Logger())
  .publish("logger")
  .provide("database", () => new Database())
  .provide("cache", ({ logger }) => new Cache(logger), {
    dispose: (cache) => cache.destroy(),
    requires: ["logger"],
  })
  .seal();

export default espresso;
