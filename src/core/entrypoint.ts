import makeDebug from "debug";
import { ArgDefinition, MainArg, validateArg } from "./argument";
import type { CommandConstraint } from "./command";
import DependencyStack, {
  DependencyEntry,
} from "./dependencies/dependency-stack";
import type { ProviderConstraint, ProvideContext } from "./provider";
import ProviderContext, { Dependency } from "./provider-context";
import UndoStack from "./undo-stack";
import Runnable, { RunArguments } from "./runnable";
import FlagManager from "./flag-manager";
import { LongFlag, ShortFlag } from "./flag";

const debug = makeDebug("espresso:command");

type ArgDefinitionToParameter<T extends ArgDefinition> = [arg: MainArg<T>];

type ArgsToTuple<TArgs extends readonly ArgDefinition[]> = TArgs extends [
  infer U extends ArgDefinition,
  ...infer Rest extends readonly ArgDefinition[],
]
  ? [...ArgDefinitionToParameter<U>, ...ArgsToTuple<Rest>]
  : [];

type MainContextArgs<TArgs extends readonly ArgDefinition[]> = TArgs extends [
  ArgDefinition,
  ...ArgDefinition[],
]
  ? { args: ArgsToTuple<TArgs> }
  : {};

type MainContextResources<
  TProvider extends ProviderConstraint,
  TContext extends CommandConstraint<TProvider>,
> = [TContext["using"]] extends [never]
  ? {}
  : {
      resources: {
        [K in TContext["using"]]: TProvider["resources"][K]["type"];
      };
    };

type StripFlag<T> = T extends ShortFlag & `-${infer U}`
  ? U
  : T extends LongFlag & `--${infer U}`
    ? U
    : never;

type MainContextFlags<
  TProvider extends ProviderConstraint,
  TContext extends CommandConstraint<TProvider>,
> = [TContext["flags"]] extends [never]
  ? {}
  : {
      flags: {
        [K in TContext["flags"] as StripFlag<K>]?: boolean | string;
      };
    };

type MainContext<
  TProvider extends ProviderConstraint,
  TContext extends CommandConstraint<TProvider>,
> = MainContextArgs<TContext["args"]> &
  MainContextResources<TProvider, TContext> &
  MainContextFlags<TProvider, TContext>;

type MainReturnType = void | number;

type BindArgsResults<TArgs extends readonly ArgDefinition[]> =
  | { success: true; results: MainContextArgs<TArgs> }
  | { success: false; error: "" };

export type MainFn<
  TProvider extends ProviderConstraint,
  TContext extends CommandConstraint<TProvider>,
> = (
  ctx: MainContext<TProvider, TContext>,
) => MainReturnType | Promise<MainReturnType>;

class Entrypoint<
  TProvider extends ProviderConstraint,
  TCommand extends CommandConstraint<TProvider>,
> extends Runnable {
  public constructor(
    private readonly provider: ProviderContext<TProvider>,
    private readonly main: MainFn<TProvider, TCommand>,
    private readonly dependencies: readonly Dependency<TProvider>[],
    private readonly args: TCommand["args"],
    private readonly flags: FlagManager,
  ) {
    super();
  }

  public async run({ positional, flags }: RunArguments): Promise<number> {
    const args = this.bindArgs(positional);
    if (!args.success) {
      // TODO: output missing args error message
      return 1;
    }

    const undoStack = new UndoStack();
    const dependencies = new DependencyStack(this.provider).get(
      this.dependencies,
    );

    debug("Dependencies:");
    dependencies.forEach(({ chains, dependency, requires }, index): void => {
      debug(`  [${index}] "${String(dependency)}"`);
      if (requires.length) {
        debug(`     REQUIRES:`);
        requires.forEach((d): void => {
          debug(`       - "${String(d)}"`);
        });
      }
      debug(`     USED BY:`);
      chains.forEach((c): void => {
        debug(`       - ${c.toString()}`);
      });
    });

    try {
      const flagsContext = this.bindFlags(flags);
      const resources = await this.instantiateResources(
        dependencies,
        this.dependencies,
        undoStack,
      );

      const result = await this.main({
        ...args.results,
        ...resources,
        ...flagsContext,
      });
      if (typeof result === "number") {
        return result;
      } else {
        return 0;
      }
    } finally {
      await undoStack.undo();
    }
  }

  private bindArgs(
    positionalArgs: readonly string[],
  ): BindArgsResults<TCommand["args"]> {
    const results: MainArg<ArgDefinition>[] = [];

    for (let index = 0; index < this.args.length; ++index) {
      const definition = this.args[index];
      const value: string | undefined = positionalArgs[index];
      const validation = validateArg(definition, value);
      if (!validation.valid) {
        return { success: false, error: "" };
      }

      results.push(validation.data);
    }

    if (!this.args.length) {
      return {
        success: true,
        results: {} as MainContextArgs<TCommand["args"]>,
      };
    }

    return {
      success: true,
      results: { args: results } as MainContextArgs<TCommand["args"]>,
    };
  }

  private bindFlags(
    flags: Record<string, string | boolean | undefined>,
  ): MainContextFlags<TProvider, TCommand> {
    if (this.flags.isEmpty) {
      return {} as MainContextFlags<TProvider, TCommand>;
    }

    return { flags: this.flags.getValues(flags) } as MainContextFlags<
      TProvider,
      TCommand
    >;
  }

  private async instantiateResources(
    dependencyStack: readonly DependencyEntry<TProvider>[],
    commandDependencies: readonly Dependency<TProvider>[],
    undoStack: UndoStack,
  ): Promise<MainContextResources<TProvider, TCommand>> {
    const instantiated: {
      // Use a wrapper object, that way a resource could be defined in-program as null or undefined and it
      // won't cause things to break here.
      [K in keyof TProvider["resources"]]?: {
        value: TProvider["resources"][K]["type"];
      };
    } = {};

    for (const dep of dependencyStack) {
      const definition = this.provider.getDependency(dep.dependency);

      const ctx = Object.fromEntries(
        definition.dependencies.map((dependency) => {
          const wrapper = instantiated[dependency];
          if (!wrapper) {
            throw new Error(
              "Dependency stack violation! Dependency SHOULD already be initialized!!",
            );
          }

          return [dependency, wrapper.value];
        }),
      ) as ProvideContext<
        TProvider,
        TProvider["resources"][keyof TProvider["resources"]]["opts"]["requires"]
      >;

      const result = await definition.provider(ctx);
      instantiated[dep.dependency] = { value: result };

      const { dispose } = definition;
      if (dispose) {
        undoStack.push(() => dispose(result));
      }
    }

    if (!commandDependencies.length) {
      return {} as MainContextResources<TProvider, TCommand>; // TODO
    }

    return {
      resources: Object.fromEntries(
        commandDependencies.map((resource) => {
          if (!instantiated[resource]) {
            throw new Error("Failed to instantiate a required dependency!");
          }

          return [resource, instantiated[resource].value];
        }),
      ),
    } as MainContextResources<TProvider, TCommand>; // TODO
  }
}

export default Entrypoint;
