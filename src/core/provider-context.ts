import type { ProviderConstraint, Resources } from "./provider";

export type Dependency<TProvider extends ProviderConstraint> =
  keyof TProvider["resources"];

class ProviderContext<T extends ProviderConstraint> {
  public constructor(
    public readonly stack: readonly string[],
    private readonly resources: Resources<T>,
  ) {}

  public getDependency<TDep extends Dependency<T>>(
    name: TDep,
  ): Resources<T>[TDep] {
    return this.resources[name];
  }
}

export default ProviderContext;
