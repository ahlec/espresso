import { CommandContext, ProviderContext } from "./context";
import { PublishedResources } from "./provider-utils";
import { Collapse } from "./utils";

type ContextConstraint<T extends CommandContext> = T;

export type BeginCommandContext<Provider extends ProviderContext> = Collapse<
  ContextConstraint<{ provider: Provider; using: never }>
>;

export type UnusedResources<Context extends CommandContext> = Exclude<
  PublishedResources<Context["provider"]>,
  Context["using"]
>;

export type Use<
  Context extends CommandContext,
  Resource extends UnusedResources<Context>,
> = Collapse<
  ContextConstraint<{
    provider: Context["provider"];
    using: Context["using"] | (Resource & string);
  }>
>;
