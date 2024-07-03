import { ProviderContext } from "@espresso/api/context";
import { ProviderImpl } from "./ProviderImpl";
import { Application } from "@espresso/api/application";
import { BeginProviderContext } from "@espresso/api/provider-utils";
import { Name } from "./Name";

export class ApplicationImpl<Context extends ProviderContext>
  extends ProviderImpl<Context>
  implements Application<Context>
{
  public static begin(name: string): Application<BeginProviderContext> {
    return new ApplicationImpl(name);
  }

  private constructor(name: string) {
    super(Name.start(name));
  }
}
