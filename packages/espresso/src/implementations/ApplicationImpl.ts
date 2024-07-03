import { ProviderContext } from "@espresso/api/context";
import { ProviderImpl } from "./ProviderImpl";
import { Application } from "@espresso/api/application";
import { BeginProviderContext } from "@espresso/api/provider-utils";

export class ApplicationImpl<Context extends ProviderContext>
  extends ProviderImpl<Context>
  implements Application<Context>
{
  public static begin(): Application<BeginProviderContext> {
    return new ApplicationImpl();
  }

  private constructor() {
    super();
  }
}
