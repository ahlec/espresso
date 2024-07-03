import { ProviderContext, ResourceContext } from "./context";
import { Collapse } from "./utils";

type ContextConstraint<T extends ProviderContext> = T;

export type BeginProviderContext = ContextConstraint<{
  // eslint-disable-next-line @typescript-eslint/ban-types -- Using Record<string, never> here breaks our types down the road
  resources: {};
}>;

export type DependenciesOpt<Context extends ProviderContext> =
  | readonly (keyof Context["resources"])[]
  | undefined;

export type PublishedResources<Context extends ProviderContext> = {
  [K in keyof Context["resources"]]: true extends Context["resources"][K]["published"]
    ? K
    : never;
}[keyof Context["resources"]];

export type UnpublishedResources<Context extends ProviderContext> = Exclude<
  keyof Context["resources"],
  PublishedResources<Context>
>;

type ResourceContextConstraint<
  Provider extends ProviderContext,
  T extends ResourceContext<Provider, unknown>,
> = T;

export type ProvideFnDependencies<
  Context extends ProviderContext,
  Dependencies extends DependenciesOpt<Context>,
> = [Dependencies] extends [Exclude<Dependencies, undefined>]
  ? Dependencies[number] extends never
    ? never // Array is empty
    : {
        [K in Dependencies[number]]: Context["resources"][K]["type"];
      }
  : never; // Undefined provided (not an array)

export type Provide<
  Context extends ProviderContext,
  T,
  Name extends string,
  Dependencies extends DependenciesOpt<Context>,
> = Collapse<
  ContextConstraint<{
    resources: Context["resources"] & {
      [K in Name]: ResourceContextConstraint<
        Context,
        {
          dependencies: Dependencies extends undefined ? [] : Dependencies;
          published: false;
          type: T;
        }
      >;
    };
  }>
>;

export type Publish<
  Context extends ProviderContext,
  Name extends UnpublishedResources<Context>,
> = Collapse<
  ContextConstraint<{
    resources: {
      [K in keyof Context["resources"]]: K extends Name
        ? ResourceContextConstraint<
            Context,
            Omit<Context["resources"][K], "published"> & { published: true }
          >
        : Context["resources"][K];
    };
  }>
>;
