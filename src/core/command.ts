import { ArgDefinition } from "./argument";
import Entrypoint, { MainFn } from "./entrypoint";
import { Flag, FlagDefinition, parseFlag } from "./flag";
import FlagManager from "./flag-manager";
import Name from "./name";
import { ProviderConstraint, PublishedResources } from "./provider";
import ProviderContext from "./provider-context";

export interface CommandConstraint<TProvider extends ProviderConstraint> {
  args: readonly ArgDefinition[];
  flags: string;
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
    flags: TContext["flags"];
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
    flags: TContext["flags"];
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

type AddFlag<
  TProvider extends ProviderConstraint,
  TContext extends CommandConstraint<TProvider>,
  TName extends Flag,
> = Constrain<
  TProvider,
  {
    args: TContext["args"];
    flags: TContext["flags"] | TName;
    hasOptionalArg: TContext["hasOptionalArg"];
    using: TContext["using"];
  }
>;

interface FlagOptions {
  aliases?: readonly Flag[];
}

export interface Command<
  TProvider extends ProviderConstraint,
  TContext extends CommandConstraint<TProvider>,
> {
  arg: [TContext["hasOptionalArg"]] extends [true]
    ? ArgOptionalOnly<TProvider, TContext>
    : ArgRequiredOrOptional<TProvider, TContext>;
  flag<T extends Flag>(
    flag: T,
    opts?: FlagOptions,
  ): Command<TProvider, AddFlag<TProvider, TContext, T>>;
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
    name: Name,
  ): Command<
    TProvider,
    { args: []; flags: never; hasOptionalArg: false; using: never }
  > {
    return new CommandImpl(provider, name, [], new FlagManager([]), {});
  }

  private constructor(
    private readonly provider: ProviderContext<TProvider>,
    private readonly name: Name,
    private readonly args: TContext["args"],
    private readonly flags: FlagManager,
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
    >(
      this.provider,
      this.name,
      [...this.args, { name, optional }],
      this.flags,
      this.using,
    );
  }

  public flag<TFlag extends Flag>(
    flag: TFlag,
    { aliases: rawAliases = [] }: FlagOptions = {},
  ): Command<TProvider, AddFlag<TProvider, TContext, TFlag>> {
    const name = parseFlag(flag);
    if (this.flags.isUsing(name)) {
      throw new Error(`${flag} is already registered as a flag/alias`);
    }

    const alreadyInDefinition = new Set<string>([name]);

    const aliases: string[] = [];
    rawAliases.forEach((alias) => {
      const parsed = parseFlag(alias);
      if (alreadyInDefinition.has(parsed)) {
        return;
      }

      if (this.flags.isUsing(alias)) {
        throw new Error(`${alias} is already registered as a flag/alias`);
      }

      alreadyInDefinition.add(parsed);
      aliases.push(parseFlag(alias));
    });

    return new CommandImpl<TProvider, TContext>(
      this.provider,
      this.name,
      this.args,
      this.flags.append({ name, aliases }),
      this.using,
    );
  }

  public use<T extends UnusedResources<TProvider, TContext>>(
    resource: T,
  ): Command<TProvider, Use<TProvider, TContext, T>> {
    return new CommandImpl<TProvider, Use<TProvider, TContext, T>>(
      this.provider,
      this.name,
      this.args,
      this.flags,
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
      this.name,
      this.provider,
      fn,
      Object.values(this.using),
      this.args,
      this.flags,
    );
  }
}

export default CommandImpl;
