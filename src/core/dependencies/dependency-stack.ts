import ProtoDependencyEntryMap, {
  ProtoDependencyEntry,
} from "./proto-dependency-entry-map";
import { ProviderConstraint } from "../provider";
import ProviderContext, { Dependency } from "../provider-context";
import DependencyChain from "./dependency-chain";
import SatisfiedManager from "./satisfied-manager";

function areEqual<TProvider extends ProviderConstraint>(
  missing: ProtoDependencyEntryMap<TProvider>,
  remaining: readonly ProtoDependencyEntry<TProvider>[],
): boolean {
  if (missing.size !== remaining.length) {
    return false;
  }

  return remaining.every(({ dependency }) => missing.has(dependency));
}

export interface DependencyEntry<TProvider extends ProviderConstraint>
  extends ProtoDependencyEntry<TProvider> {
  requires: readonly Dependency<TProvider>[];
}

class DependencyStack<TProvider extends ProviderConstraint> {
  public constructor(private readonly provider: ProviderContext<TProvider>) {}

  public get(
    commandDependencies: readonly Dependency<TProvider>[],
  ): readonly DependencyEntry<TProvider>[] {
    const entries = this.getInternal(
      commandDependencies.map(
        (dependency): ProtoDependencyEntry<TProvider> => ({
          dependency,
          chains: [DependencyChain.atCommand()],
        }),
      ),
      SatisfiedManager.new<TProvider>(),
    );

    return entries.map(
      (proto): DependencyEntry<TProvider> => ({
        ...proto,
        requires: this.provider.getDependency(proto.dependency).dependencies,
      }),
    );
  }

  private getInternal(
    remaining: readonly ProtoDependencyEntry<TProvider>[],
    satisfied: SatisfiedManager<TProvider>,
  ): readonly ProtoDependencyEntry<TProvider>[] {
    const ready = new ProtoDependencyEntryMap<TProvider>();
    const missing = new ProtoDependencyEntryMap<TProvider>();
    remaining.forEach(({ dependency, chains }): void => {
      const definition = this.provider.getDependency(dependency);
      let isReady = true;
      definition.dependencies.forEach((d) => {
        if (satisfied.has(d)) {
          // We've already got this dependency covered
          return;
        }

        // We're missing this dependency
        isReady = false;
      });

      if (!isReady) {
        missing.add(dependency, chains);
      } else {
        ready.add(dependency, chains);
      }
    });

    // For all of the dependencies that just finished up, make sure that any resources that these depend on
    // also have registered chains to here.
    // This allows us to capture parent -> child relationships where the child was asked for. For example,
    // "A -> B, B -> C" and the command asked for resource C.
    ready.forEach(({ dependency, chains }): void => {
      const definition = this.provider.getDependency(dependency);
      definition.dependencies.forEach((d): void => {
        satisfied.has(d)?.addChain(chains.map((chain) => chain.to(dependency)));
      });
    });

    // For any dependencies we're still missing, let's go through and add THEIR dependencies.
    // We do this as a second step because it could be the case that dependency A requires
    // dependency B, but they're both found in `remaining`
    missing.forEach(({ dependency, chains }): void => {
      const definition = this.provider.getDependency(dependency);
      definition.dependencies.forEach((d): void => {
        if (satisfied.has(d) || ready.has(d)) {
          return;
        }

        missing.add(
          d,
          chains.map((chain) => chain.to(dependency)),
        );
      });
    });

    // BASE CASE #1: We can't secure one or more dependencies (eg, cyclical dependency)
    //  - If missing = remaining, then that means we'll never be able to secure these
    //    dependencies. This would be an error state!
    if (areEqual(missing, remaining)) {
      throw new Error(
        "Unable to secure all dependencies! Cyclical dependencies",
      );
    }

    // BASE CASE #2: We have all of our dependencies!
    if (!missing.size) {
      return ready.toArray();
    }

    // We still have more dependencies to secure. Recurse down and secure those
    const after = this.getInternal(missing.toArray(), satisfied.concat(ready));
    return ready.toArray().concat(after);
  }
}

export default DependencyStack;
