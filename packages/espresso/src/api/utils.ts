/**
 * TypeScript will, by default, just show a compounding collection
 * of types as we make changes to it. You wind up with something
 * that looks like:
 *    Provider<Provide<Provide<Publish<Provide<Begin<Finish<...
 *
 * If we wrap the resulting contexts in this collapse function
 * (modified from ExpandRecursive), we'll be able to condense this
 * down to the resulting values:
 *    Provide<{ resources: { ...} }>
 *
 * This isn't necessary for functionality. This is solely to make
 * debugging easier by being able to easily inspect the values
 * at a given point.
 */
export type Collapse<T> = T extends object
  ? T extends infer O
    ? { [K in keyof O]: K extends "type" ? O[K] : Collapse<O[K]> }
    : never
  : T;
