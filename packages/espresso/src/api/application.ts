import { ProviderContext } from "./context";
import { Provider } from "./provider";

export interface Application<Context extends ProviderContext>
  extends Provider<Context> {}
