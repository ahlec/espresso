import { ProviderContext } from "@espresso/api/context";
import { FreshStart } from "@espresso/api/fresh-start";
import { Provider } from "@espresso/api/provider";
import {
  DependenciesOpt,
  Provide,
  PublishedResources,
  Publish,
} from "@espresso/api/provider-utils";
import { Name } from "./Name";

export class ProviderImpl<Context extends ProviderContext>
  implements Provider<Context>
{
  public constructor(public readonly name: Name) {}

  public provide<
    T,
    Name extends string,
    Dependencies extends DependenciesOpt<Context>,
  >(): Provider<Provide<Context, T, Name, Dependencies>> {
    throw new Error("Method not implemented.");
  }

  public publish<
    Name extends Exclude<
      keyof Context["resources"],
      PublishedResources<Context>
    >,
  >(): Provider<Publish<Context, Name>> {
    throw new Error("Method not implemented.");
  }

  public finish(): FreshStart<Context> {
    throw new Error("Method not implemented.");
  }
}
