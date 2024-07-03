import { Command } from "./command";
import { BeginCommandContext } from "./command-utils";
import { ProviderContext } from "./context";
import { Provider } from "./provider";

export interface FreshStart<Context extends ProviderContext> {
  /**
   * Begin a new group. A group is an intermediary node in the application.
   * It is capable of containing other groups and other commands.
   *
   * Groups are capable of defining resources for all entities underneath to
   * use.
   */
  group(name: string): Provider<Context>;

  /**
   * Begin a new command -- a script that can be invoked to run custom
   * code.
   *
   * Commands are leaf nodes. Once you finish a command, you will not
   * be able to create additional resources underneath the command.
   */
  command(name: string): Command<BeginCommandContext<Context>>;
}
