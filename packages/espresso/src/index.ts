import type { Application } from "./api/application";
import type { BeginProviderContext } from "./api/provider-utils";
import { ApplicationImpl } from "./implementations/ApplicationImpl";
export type { Application } from "./api/application";
export type { Command } from "./api/command";
export type { Provider } from "./api/provider";

/**
 * Constructs a new application -- the root of your CLI tree.
 */
export function espresso(name: string): Application<BeginProviderContext> {
  return ApplicationImpl.begin(name);
}
