import ProviderImpl from "./provider";

class Program extends ProviderImpl<{ resources: {}; env: [] }> {
  public constructor() {
    super({});
  }
}

export default Program;
