import Provider from "./provider";

class Program extends Provider<{ resources: {}; env: [] }> {
  public constructor() {
    super({});
  }
}

export default Program;
