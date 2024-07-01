import ProviderImpl, { Provider } from "./provider";
import Name from "./name";

class Program extends ProviderImpl<{ resources: {}; env: [] }> {
  public static start(name: string): Provider<{ resources: {}; env: [] }> {
    return new Program(name);
  }

  private constructor(name: string) {
    super(Name.start(name), {});
  }
}

export default Program;
