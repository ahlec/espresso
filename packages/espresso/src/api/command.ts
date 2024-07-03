import { UnusedResources, Use } from "./command-utils";
import { CommandContext } from "./context";

export interface Command<Context extends CommandContext> {
  /**
   * Consume a resource provided by a parent (or ancestor) provider. This
   * indicates that, prior to running the command, the requested resource
   * should be instantiated and injected into the command script.
   *
   * Only resources which have been published can be used by commands. All
   * resources are declared unpublished (`protected` scope). A resource can
   * then subsequently be published (moved to `public` scope), which allows
   * commands to use it.
   */
  use<Resource extends UnusedResources<Context>>(
    resource: Resource,
  ): Command<Use<Context, Resource>>;
}
