type NameType = "program" | "group" | "cli" | "group-default";

type ChainableNameType = Extract<NameType, "group" | "cli">;

export interface ReadonlyName {
  readonly program: string;
  readonly groups: readonly string[];
  readonly self: string;
  readonly type: NameType;

  isChildOf(parent: Name): boolean;
}

interface Name extends ReadonlyName {
  chain(next: string, type: ChainableNameType): Name;
  default(): ReadonlyName;
}

class NameImpl implements Name {
  public static start(programName: string): Name {
    return new NameImpl(programName, [], "", "program");
  }

  public static from(programName: string, pieces: readonly string[]): Name {
    const groups = [...pieces];
    const self = groups.pop();
    return new NameImpl(programName, groups, self ?? "", "group"); // TODO?
  }

  private constructor(
    public readonly program: string,
    public readonly groups: readonly string[],
    public readonly self: string,
    public readonly type: NameType,
  ) {}

  public isChildOf(parent: Name): boolean {
    if (this.program !== parent.program) {
      return false;
    }

    if (parent.type === "program") {
      return !this.groups.length;
    }

    if (this.groups.length !== parent.groups.length + 1) {
      return false;
    }

    for (let index = 0; index < parent.groups.length; ++index) {
      if (this.groups[index] !== parent.groups[index]) {
        return false;
      }
    }

    return this.groups[this.groups.length - 1] === parent.self;
  }

  public chain(next: string, type: ChainableNameType): Name {
    let nextGroups: readonly string[];
    switch (this.type) {
      case "program": {
        nextGroups = [];
        break;
      }
      case "group-default": {
        throw new Error("Cannot chain from a group default action!");
      }
      case "cli":
      case "group": {
        nextGroups = [...this.groups, this.self];
        break;
      }
    }

    return new NameImpl(this.program, nextGroups, next, type);
  }

  public default(): ReadonlyName {
    switch (this.type) {
      case "program":
      case "group": {
        break;
      }
      case "cli":
      case "group-default": {
        throw new Error(
          `Unable to chain from '${this.type}' to 'group-default'`,
        );
      }
    }

    return new NameImpl(this.program, this.groups, this.self, "group-default");
  }

  public toString(): string {
    return [this.program, ...this.groups, this.self].join(" ");
  }
}

export default NameImpl;
