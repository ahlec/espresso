import { ProviderConstraint } from "../provider";
import { Dependency } from "../provider-context";
import DependencyChain from "./dependency-chain";
import ProtoDependencyEntryMap from "./proto-dependency-entry-map";

interface SatisfiedDependency<TProvider extends ProviderConstraint> {
  addChain(chains: readonly DependencyChain<TProvider>[]): void;
}

class SatisfiedManager<TProvider extends ProviderConstraint> {
  public static new<
    TProvider extends ProviderConstraint,
  >(): SatisfiedManager<TProvider> {
    return new SatisfiedManager<TProvider>([]);
  }

  private constructor(
    private readonly maps: readonly ProtoDependencyEntryMap<TProvider>[],
  ) {}

  public concat(
    newlyReady: ProtoDependencyEntryMap<TProvider>,
  ): SatisfiedManager<TProvider> {
    return new SatisfiedManager<TProvider>([...this.maps, newlyReady]);
  }

  public has(
    dependency: Dependency<TProvider>,
  ): SatisfiedDependency<TProvider> | null {
    for (const map of this.maps) {
      if (map.has(dependency)) {
        return {
          addChain: (chains): void => {
            map.add(dependency, chains);
          },
        };
      }
    }

    return null;
  }
}

export default SatisfiedManager;
