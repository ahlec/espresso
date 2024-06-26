import { ArgDefinition } from "./argument";
import Entrypoint, { MainFn } from "./entrypoint";
import { ProviderConstraint, PublishedResources } from "./provider";
import ProviderContext from "./provider-context";

export interface CommandConstraint<TProvider extends ProviderConstraint> {
  args: readonly ArgDefinition[];
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
    using: TContext["using"] | T;
  }
>;

type AddArg<
  TProvider extends ProviderConstraint,
  TContext extends CommandConstraint<TProvider>,
  T extends ArgDefinition,
> = Constrain<
  TProvider,
  {
    args: [...TContext["args"], T];
    using: TContext["using"];
  }
>;

type Using<
  TProvider extends ProviderConstraint,
  TContext extends CommandConstraint<TProvider>,
> = {
  [K in TContext["using"]]: K;
};

class Command<
  TProvider extends ProviderConstraint,
  TContext extends CommandConstraint<TProvider>,
> {
  public static begin<TProvider extends ProviderConstraint>(
    provider: ProviderContext<TProvider>,
    name: string,
  ): Command<TProvider, { args: []; using: never }> {
    return new Command(provider, name, [], {});
  }

  private constructor(
    private readonly provider: ProviderContext<TProvider>,
    private readonly name: string,
    private readonly args: TContext["args"],
    private readonly using: Using<TProvider, TContext>,
  ) {}

  public arg<TName extends string>(name: TName) {
    return new Command<TProvider, AddArg<TProvider, TContext, { name: TName }>>(
      this.provider,
      this.name,
      [...this.args, { name: name }],
      this.using,
    );
  }

  public use<T extends UnusedResources<TProvider, TContext>>(
    resource: T,
  ): Command<TProvider, Use<TProvider, TContext, T>> {
    return new Command<TProvider, Use<TProvider, TContext, T>>(
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
    );
  }
}

export default Command;
