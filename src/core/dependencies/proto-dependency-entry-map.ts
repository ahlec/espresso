import type { ProviderConstraint } from "../provider";
import type { Dependency } from "../provider-context";
import DependencyChain from "./dependency-chain";

export interface ProtoDependencyEntry<TProvider extends ProviderConstraint> {
  dependency: Dependency<TProvider>;
  chains: readonly DependencyChain<TProvider>[];
}

class ProtoDependencyEntryMap<TProvider extends ProviderConstraint> {
  private readonly data: Map<
    Dependency<TProvider>,
    ProtoDependencyEntry<TProvider>
  >;

  public constructor(orig?: ProtoDependencyEntryMap<TProvider>) {
    this.data = new Map(orig?.data);
  }

  public get size(): number {
    return this.data.size;
  }

  public has(dependency: Dependency<TProvider>): boolean {
    return this.data.has(dependency);
  }

  public add(
    dependency: Dependency<TProvider>,
    chains: readonly DependencyChain<TProvider>[],
  ): void {
    const existing = this.data.get(dependency);
    let entry: ProtoDependencyEntry<TProvider>;
    if (existing) {
      entry = {
        ...existing,
        chains: DependencyChain.unique(existing.chains, chains),
      };
    } else {
      entry = {
        dependency,
        chains,
      };
    }

    this.data.set(dependency, entry);
  }

  public forEach(
    fn: (dependency: ProtoDependencyEntry<TProvider>) => void,
  ): void {
    this.data.forEach((entry): void => fn(entry));
  }

  public toArray(): readonly ProtoDependencyEntry<TProvider>[] {
    return Array.from(this.data.values());
  }
}

export default ProtoDependencyEntryMap;
