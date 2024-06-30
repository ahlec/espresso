import { FlagDefinition } from "./flag";

class FlagManager {
  private readonly usedNames: ReadonlySet<string>;

  public constructor(private readonly definitions: readonly FlagDefinition[]) {
    const used = new Set<string>();
    definitions.forEach(({ name, aliases }): void => {
      used.add(name);
      aliases.forEach((alias) => used.add(alias));
    });
    this.usedNames = used;
  }

  public get isEmpty(): boolean {
    return !this.definitions.length;
  }

  public getValues(
    input: Record<string, string | boolean | undefined>,
  ): Record<string, string | boolean | undefined> {
    const result: Record<string, string | boolean | undefined> = {};
    this.definitions.forEach((d): void => {
      // Try the main name first
      const main = input[d.name];
      if (typeof main !== "undefined") {
        result[d.name] = main;
        return;
      }

      // Check aliases
      let didFind = false;
      d.aliases.forEach((alias): void => {
        if (didFind) {
          return;
        }

        const value = input[alias];
        if (typeof value === "undefined") {
          return;
        }

        didFind = true;
        // It came from the alias, but it goes into the primary name
        result[d.name] = value;
      });
    });
    return result;
  }

  public isUsing(name: string): boolean {
    return this.usedNames.has(name);
  }

  public append(definition: FlagDefinition): FlagManager {
    return new FlagManager([...this.definitions, definition]);
  }
}

export default FlagManager;
