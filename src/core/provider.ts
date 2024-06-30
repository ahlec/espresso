import CommandImpl, { Command, CommandConstraint } from "./command";
import ProviderContext from "./provider-context";

interface BlankSlate<T extends ProviderConstraint> {
  group(name: string): Provider<T>;

  cli(
    name: string,
  ): Command<T, { args: []; hasOptionalArg: false; using: never }>;
}

export interface Provider<T extends ProviderConstraint> {
  provide<
    TName extends string,
    TResource,
    TOptsRequires extends ProvideOpts<T, TResource>["requires"],
  >(
    name: TName,
    fn: ProvideFn<T, TResource, TOptsRequires>,
    opts?: MakeProvideOpts<T, TResource, TOptsRequires>,
  ): Provider<
    AddResource<
      T,
      TName,
      TResource,
      {
        type: TResource;
        opts: MakeProvideOpts<T, TResource, TOptsRequires>;
        isPublished: false;
      }
    >
  >;

  publish<TName extends UnpublishedResources<T>>(
    name: TName,
  ): Provider<PublishResource<T, TName>>;

  seal(): BlankSlate<T>;
}

interface ResourceDefinitionConstraint<
  TProvider extends ProviderConstraint,
  T,
> {
  type: T;
  opts: ProvideOpts<TProvider, T>;
  isPublished: boolean;
}

export interface ProviderConstraint {
  resources: Record<string, ResourceDefinitionConstraint<this, unknown>>;
  env: readonly string[];
}

interface ProvideOpts<TCurr extends ProviderConstraint, T> {
  dispose?: DisposeFn<T>;
  requires?: readonly (keyof TCurr["resources"])[];
}

type MakeProvideOpts<
  TCurr extends ProviderConstraint,
  T,
  TOptsRequires extends ProvideOpts<TCurr, unknown>["requires"],
> = { requires: TOptsRequires } & (
  | { dispose?: never }
  | { dispose: DisposeFn<T> }
);

export type ProvideContext<
  TCurr extends ProviderConstraint,
  TOptsRequires extends ProvideOpts<TCurr, unknown>["requires"],
> = [TOptsRequires] extends [Exclude<TOptsRequires, undefined>]
  ? { [K in TOptsRequires[number]]: TCurr["resources"][K]["type"] }
  : never;

type ProvideFn<
  TCurr extends ProviderConstraint,
  T,
  TOptsRequires extends ProvideOpts<TCurr, unknown>["requires"],
> = (ctx: ProvideContext<TCurr, TOptsRequires>) => T | Promise<T>;

type DisposeFn<T> = (obj: T) => void | Promise<void>;

type ResourceDefinition<
  T extends ProviderConstraint,
  K extends keyof T["resources"],
> = {
  provider: ProvideFn<
    T,
    T["resources"][K]["type"],
    T["resources"][K]["opts"]["requires"]
  >;
  dependencies: Exclude<T["resources"][K]["opts"]["requires"], undefined>;
  dispose: DisposeFn<T["resources"][K]["type"]> | null;
  isPublished: T["resources"][K]["isPublished"];
};

export type Resources<T extends ProviderConstraint> = {
  [K in keyof T["resources"]]: ResourceDefinition<T, K>;
};

export type PublishedResources<T extends ProviderConstraint> = {
  [K in keyof T["resources"]]: true extends T["resources"][K]["isPublished"]
    ? K
    : never;
}[keyof T["resources"]];

type UnpublishedResources<T extends ProviderConstraint> = Exclude<
  keyof T["resources"],
  PublishedResources<T>
>;

type Constrain<T extends ProviderConstraint> = T;

// expands object types one level deep
type Expand<T> = T extends infer O ? { [K in keyof O]: O[K] } : never;

// expands object types recursively
type ExpandRecursively<T> = T extends object
  ? T extends infer O
    ? { [K in keyof O]: K extends "type" ? O[K] : ExpandRecursively<O[K]> }
    : never
  : T;

type AddResource<
  TCurr extends ProviderConstraint,
  TName extends string,
  T,
  TResource extends ResourceDefinitionConstraint<TCurr, T>,
> = ExpandRecursively<
  Constrain<{
    resources: Omit<TCurr["resources"], TName> & { [X in TName]: TResource };
    env: TCurr["env"];
  }>
>;

type PublishResource<
  TCurr extends ProviderConstraint,
  TName extends keyof TCurr["resources"],
> = ExpandRecursively<
  Constrain<{
    resources: Omit<TCurr["resources"], TName> & {
      [X in TName]: Omit<TCurr["resources"][X], "isPublished"> & {
        isPublished: true;
      };
    };
    env: TCurr["env"];
  }>
>;

class ProviderImpl<TCurr extends ProviderConstraint>
  implements Provider<TCurr>, BlankSlate<TCurr>
{
  protected constructor(private readonly resources: Resources<TCurr>) {}

  public provide<
    TName extends string,
    T,
    TOptsRequires extends ProvideOpts<TCurr, T>["requires"],
  >(
    name: TName,
    fn: ProvideFn<TCurr, T, TOptsRequires>,
    opts?: MakeProvideOpts<TCurr, T, TOptsRequires>,
  ): Provider<
    AddResource<
      TCurr,
      TName,
      T,
      {
        type: T;
        opts: MakeProvideOpts<TCurr, T, TOptsRequires>;
        isPublished: false;
      }
    >
  > {
    const definition: ResourceDefinition<TCurr, TName> = {
      provider: fn as any, // TODO
      dependencies: (opts?.requires as any) ?? [], // TODO
      dispose: opts?.dispose as any, // TODO
      isPublished: false,
    };

    return new ProviderImpl({
      ...this.resources,
      [name]: definition,
    } as any); // TODO
  }

  public publish<TName extends UnpublishedResources<TCurr>>(
    name: TName,
  ): Provider<PublishResource<TCurr, TName>> {
    const next = {
      ...this.resources,
      [name]: {
        ...this.resources[name],
        isPublished: true,
      } as any, // TODO
    } as Resources<PublishResource<TCurr, TName>>; // TODO
    return new ProviderImpl<PublishResource<TCurr, TName>>(next);
  }

  public group(): Provider<TCurr> {
    return this;
  }

  public cli(name: string) {
    return CommandImpl.begin<TCurr>(new ProviderContext(this.resources), name);
  }

  public seal(): BlankSlate<TCurr> {
    return this;
  }
}

export default ProviderImpl;
