export interface ResourceContext<Provider extends ProviderContext, T> {
  dependencies: readonly (keyof Provider["resources"])[];
  published: boolean;
  type: T;
}

export interface ProviderContext {
  resources: Record<string, ResourceContext<this, unknown>>;
}

export interface CommandContext {
  provider: ProviderContext;
  using: keyof this["provider"]["resources"];
}
