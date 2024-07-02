type Letter =
  | "a"
  | "b"
  | "c"
  | "d"
  | "e"
  | "f"
  | "g"
  | "h"
  | "i"
  | "j"
  | "k"
  | "l"
  | "m"
  | "n"
  | "o"
  | "p"
  | "q"
  | "r"
  | "s"
  | "t"
  | "u"
  | "v"
  | "w"
  | "x"
  | "y"
  | "z";

export type ShortFlag = `-${Letter | Capitalize<Letter>}`;
export type LongFlag = `--${Letter | Capitalize<Letter>}${string}`;
export type Flag = ShortFlag | LongFlag;

export interface FlagDefinition {
  name: string;
  aliases: readonly string[];
  displayNames: readonly string[];
  description: string | null;
}

function parseShortFlag(str: ShortFlag): string {
  if (str.length !== 2) {
    throw new Error(
      `Flag '${str}' is not a valid short flag -- must be 2 characters long`,
    );
  }

  if (str[0] !== "-") {
    throw new Error(`Flag '${str}' must start with a single hyphen`);
  }

  const [, character] = str;
  if (character.toLowerCase() < "a" || character.toLowerCase() > "z") {
    throw new Error(`Flag '${str}' contains a non-alphabetic character`);
  }

  return character;
}

function isShortFlag(str: Flag): str is ShortFlag {
  return str.length === 2;
}

function parseLongFlag(str: LongFlag): string {
  const match = str.match(/^--([a-zA-Z][a-zA-Z0-9-]*)$/);
  if (!match) {
    if (!str.startsWith("--")) {
      throw new Error(`Flag '${str}' does not start with double hyphens`);
    }

    if (str.length === 2) {
      throw new Error(`Flag '${str}' is not long enough to be a flag`);
    }

    const firstChar = str[2];
    if (firstChar.toLowerCase() < "a" || firstChar.toLowerCase() > "z") {
      throw new Error(
        `Flag '${str}' cannot begin with a non-alphabetic character`,
      );
    }

    throw new Error(`Flag '${str}' contains invalid characters`);
  }

  return match[1];
}

export function parseFlag(str: Flag): string {
  if (isShortFlag(str)) {
    return parseShortFlag(str);
  }

  return parseLongFlag(str);
}

export function hasHelpFlag(
  flags: Record<string, string | boolean | undefined>,
): boolean {
  return Boolean(flags["h"]) || Boolean(flags["help"]);
}
