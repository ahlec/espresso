import { ProviderConstraint } from "../provider";
import { Dependency } from "../provider-context";

class DependencyChain<TProvider extends ProviderConstraint> {
  public static atCommand<
    TProvider extends ProviderConstraint,
  >(): DependencyChain<TProvider> {
    return new DependencyChain<TProvider>(["__$command"]);
  }

  public static unique<TProvider extends ProviderConstraint>(
    ...input: (readonly DependencyChain<TProvider>[])[]
  ): readonly DependencyChain<TProvider>[] {
    const results = new Map<string, DependencyChain<TProvider>>();

    input.forEach((chains): void =>
      chains.forEach((chain): void => {
        const str = chain.toString();
        if (!results.has(str)) {
          results.set(str, chain);
        }
      }),
    );

    return Array.from(results.values());
  }

  private constructor(
    private readonly chain: readonly (Dependency<TProvider> | "__$command")[],
  ) {}

  public to(dependency: Dependency<TProvider>): DependencyChain<TProvider> {
    return new DependencyChain<TProvider>([...this.chain, dependency]);
  }

  public toString(): string {
    return this.chain.join(" -> ");
  }

  public toJSON(): string {
    return this.toString();
  }
}

export default DependencyChain;
