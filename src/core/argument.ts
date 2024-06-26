export interface ArgDefinition {
  name: string;
  optional: boolean;
}

class Argument<T extends ArgDefinition> {
  public constructor(private readonly definition: T) {}
}

export default Argument;
