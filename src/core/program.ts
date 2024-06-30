import ProviderImpl, { Provider } from "./provider";

class Program extends ProviderImpl<{ resources: {}; env: [] }> {
  public static start(): Provider<{ resources: {}; env: [] }> {
    return new Program();
  }

  private constructor() {
    super({});
  }
}

export default Program;
