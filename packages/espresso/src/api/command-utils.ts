import { CommandContext, ProviderContext } from "./context";
import { PublishedResources } from "./provider-utils";

type ContextConstraint<T extends CommandContext> = T;

export type BeginCommandContext<Provider extends ProviderContext> =
  ContextConstraint<{ provider: Provider; using: never }>;

export type UnusedResources<Context extends CommandContext> = Exclude<
  PublishedResources<Context["provider"]>,
  Context["using"]
>;

export type Use<
  Context extends CommandContext,
  Resource extends UnusedResources<Context>,
> = ContextConstraint<{
  provider: Context["provider"];
  using: Context["using"] | (Resource & string);
}>;
