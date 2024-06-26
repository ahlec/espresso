export interface ArgDefinition {
  name: string;
  optional: boolean;
}

export type MainArg<T extends ArgDefinition> = [T["optional"]] extends [false]
  ? string
  : string | null;

type ValidateResult<T extends ArgDefinition> =
  | { valid: true; data: MainArg<T> }
  | { valid: false };

export function validateArg<T extends ArgDefinition>(
  definition: T,
  value: string | undefined,
): ValidateResult<T> {
  if (!definition.optional) {
    if (!value) {
      return { valid: false };
    }

    return { valid: true, data: value };
  }

  return { valid: true, data: value ?? (null as any) };
}
