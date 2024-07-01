import ProviderImpl, { Provider } from "./provider";

class Program extends ProviderImpl<{ resources: {}; env: [] }> {
  public static start(name: string): Provider<{ resources: {}; env: [] }> {
    return new Program(name);
  }

  private constructor(name: string) {
    super(name, [], {});
  }
}

export default Program;
