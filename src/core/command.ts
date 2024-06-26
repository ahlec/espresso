import { ArgDefinition } from "./argument";
import Entrypoint, { MainFn } from "./entrypoint";
import { ProviderConstraint, PublishedResources } from "./provider";
import ProviderContext from "./provider-context";

export interface CommandConstraint<TProvider extends ProviderConstraint> {
  args: readonly ArgDefinition[];
  hasOptionalArg: boolean;
  using: keyof TProvider["resources"];
}

type Constrain<
  TProvider extends ProviderConstraint,
  T extends CommandConstraint<TProvider>,
> = T;

type UnusedResources<
  TProvider extends ProviderConstraint,
  TContext extends CommandConstraint<TProvider>,
> = Exclude<PublishedResources<TProvider>, TContext["using"]>;

type Use<
  TProvider extends ProviderConstraint,
  TContext extends CommandConstraint<TProvider>,
  T extends UnusedResources<TProvider, TContext>,
> = Constrain<
  TProvider,
  {
    args: TContext["args"];
    hasOptionalArg: TContext["hasOptionalArg"];
    using: TContext["using"] | T;
  }
>;

type BooleanOr<T extends boolean, U extends boolean> = [T] extends [true]
  ? true
  : [U] extends [true]
    ? true
    : false;

type AddArg<
  TProvider extends ProviderConstraint,
  TContext extends CommandConstraint<TProvider>,
  TName extends string,
  TOptional extends boolean,
> = Constrain<
  TProvider,
  {
    args: [...TContext["args"], { name: TName; optional: TOptional }];
    hasOptionalArg: BooleanOr<TContext["hasOptionalArg"], TOptional>;
    using: TContext["using"];
  }
>;

type Using<
  TProvider extends ProviderConstraint,
  TContext extends CommandConstraint<TProvider>,
> = {
  [K in TContext["using"]]: K;
};

interface ArgRequiredOrOptional<
  TProvider extends ProviderConstraint,
  TContext extends CommandConstraint<TProvider>,
> {
  <TName extends string>(
    name: TName,
  ): Command<TProvider, AddArg<TProvider, TContext, TName, false>>;
  <TName extends string, const TOptional extends boolean>(
    name: TName,
    opts: { optional: TOptional },
  ): Command<TProvider, AddArg<TProvider, TContext, TName, TOptional>>;
}

interface ArgOptionalOnly<
  TProvider extends ProviderConstraint,
  TContext extends CommandConstraint<TProvider>,
> {
  <TName extends string>(
    name: TName,
    opts: { optional: true },
  ): Command<TProvider, AddArg<TProvider, TContext, TName, true>>;
}

export interface Command<
  TProvider extends ProviderConstraint,
  TContext extends CommandConstraint<TProvider>,
> {
  arg: [TContext["hasOptionalArg"]] extends [true]
    ? ArgOptionalOnly<TProvider, TContext>
    : ArgRequiredOrOptional<TProvider, TContext>;
  use<T extends UnusedResources<TProvider, TContext>>(
    resource: T,
  ): Command<TProvider, Use<TProvider, TContext, T>>;
  main(fn: MainFn<TProvider, TContext>): Entrypoint<TProvider, TContext>;
}

class CommandImpl<
  TProvider extends ProviderConstraint,
  TContext extends CommandConstraint<TProvider>,
> implements Command<TProvider, TContext>
{
  public static begin<TProvider extends ProviderConstraint>(
    provider: ProviderContext<TProvider>,
    name: string,
  ): Command<TProvider, { args: []; hasOptionalArg: false; using: never }> {
    return new CommandImpl(provider, name, [], {});
  }

  private constructor(
    private readonly provider: ProviderContext<TProvider>,
    private readonly name: string,
    private readonly args: TContext["args"],
    private readonly using: Using<TProvider, TContext>,
  ) {}

  public arg<TName extends string>(
    name: TName,
  ): Command<TProvider, AddArg<TProvider, TContext, TName, false>>;
  public arg<TName extends string, const TOptional extends boolean>(
    name: TName,
    opts: { optional: TOptional },
  ): Command<TProvider, AddArg<TProvider, TContext, TName, TOptional>>;
  public arg<TName extends string>(
    name: TName,
    { optional = false }: { optional?: boolean } = {},
  ): Command<TProvider, AddArg<TProvider, TContext, TName, boolean>> {
    // Validate the `optional` parameter
    if (!optional) {
      // This argument can only be required if there are no optional arguments already
      if (this.args.some((arg) => arg.optional)) {
        throw new Error(
          "Cannot declare an argument required after an optional argument",
        );
      }
    }

    return new CommandImpl<
      TProvider,
      AddArg<TProvider, TContext, TName, boolean>
    >(this.provider, this.name, [...this.args, { name, optional }], this.using);
  }

  public use<T extends UnusedResources<TProvider, TContext>>(
    resource: T,
  ): Command<TProvider, Use<TProvider, TContext, T>> {
    return new CommandImpl<TProvider, Use<TProvider, TContext, T>>(
      this.provider,
      this.name,
      this.args,
      {
        ...this.using,
        [resource]: resource,
      },
    );
  }

  public main(
    fn: MainFn<TProvider, TContext>,
  ): Entrypoint<TProvider, TContext> {
    return new Entrypoint<TProvider, TContext>(
      this.provider,
      fn,
      Object.values(this.using),
      this.args,
    );
  }
}

export default CommandImpl;
