import Logger from "./Logger";

interface CacheEntry {
  value: unknown;
}

class Cache {
  private data: Record<string, CacheEntry | undefined> = {};

  public constructor(private readonly logger: Logger) {}

  public get(key: string): CacheEntry | null {
    return this.data[key] ?? null;
  }

  public set(key: string, value: unknown): void {
    this.data[key] = { value };
  }

  public dispose(): void {
    this.logger.writeLine("cache.dispose()");
  }
}

export default Cache;
