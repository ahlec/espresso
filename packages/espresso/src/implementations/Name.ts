export type NameType = "program" | "group" | "command";
type ChainableNameType = Extract<NameType, "group" | "command">;

/**
 * Punctuation and non-alphanumeric characters that ARE allowed
 * in names.
 */
const VALID_CHARACTERS: ReadonlySet<string> = new Set([".", "_", "-"]);

function assertIsValidName(str: string): void {
  if (/\s/.test(str)) {
    throw new Error(`'${str}' is an invalid name: cannot contain whitespace`);
  }

  if (!str) {
    throw new Error(`'${str}' is an invalid name: empty`);
  }

  const nonalphanumeric = str.match(/([^a-zA-Z0-9])/g);
  const firstInvalidCharacter = nonalphanumeric?.find(
    (char) => !VALID_CHARACTERS.has(char),
  );
  if (firstInvalidCharacter) {
    throw new Error(
      `'${str}' is an invalid name: contains invalid character '${firstInvalidCharacter}'`,
    );
  }
}

export class Name {
  public static start(programName: string): Name {
    assertIsValidName(programName);
    return new Name(programName, [], "program");
  }

  private constructor(
    public readonly program: string,
    public readonly subcommands: readonly string[],
    public readonly type: NameType,
  ) {}

  public chain(name: string, type: ChainableNameType): Name {
    assertIsValidName(name);

    switch (type) {
      case "command":
      case "group": {
        break;
      }
      default: {
        throw new Error(`Unable to chain to type '${String(type)}'`);
      }
    }

    return new Name(this.program, [...this.subcommands, name], type);
  }
}
