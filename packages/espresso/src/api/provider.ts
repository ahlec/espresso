import { ProviderContext } from "./context";
import { FreshStart } from "./fresh-start";
import {
  DependenciesOpt,
  Provide,
  ProvideFnDependencies,
  Publish,
  UnpublishedResources,
} from "./provider-utils";

type ProvideFn<
  Context extends ProviderContext,
  T,
  Dependencies extends DependenciesOpt<Context>,
> = (
  dependencies: ProvideFnDependencies<Context, Dependencies>,
) => T | Promise<T>;

type DisposeFn<T> = (obj: T) => void | Promise<void>;

interface ProvideOpts<
  Context extends ProviderContext,
  T,
  Dependencies extends DependenciesOpt<Context>,
> {
  /**
   * An optional array of already-defined resources that this resource depends
   * upon. If the program determines that THIS resource needs to be
   * instantiated, all dependencies this requires will be instantiated first
   * and then passed in to the constructor function.
   *
   * Unlike commands, which can only use published resources, the dependencies
   * of a resource can be published or unpublished. In this way, you can have
   * "internal" resources that are shared amongst your dependencies, but have a
   * clean public API for your commands.
   */
  requires?: Dependencies;

  /**
   * A cleanup function, if this resource has cleanup needs. This function will
   * be run after the command has finished. It will be run regardless of the
   * exit code of the command, and will attempt to be run even if the command
   * exited with an uncaught error.
   *
   * The instance of the resource is passed in to the dispose function.
   */
  dispose?: DisposeFn<T>;
}

export interface Provider<Context extends ProviderContext> {
  /**
   * Define a new dependency that commands (scripts) and other, subsequent
   * dependencies may use.
   *
   * A dependency may be any type. Dependencies are provided with a
   * constructor function to instantiate them on request, and an optional
   * disposal function for any cleanup. At runtime, if a dependency is
   * needed, it will be instantiated at that time. If the command being
   * run does not require this dependency, it will not be instantiated.
   *
   * @param name The name of this dependency. This is what commands and
   * other dependencies will reference when indicating this dependency.
   *
   * Any string is valid, but a valid JavaScript identifier is most
   * convenient as the name will be used as a field in the resources object
   * given to the command.
   * @param fn The constructor function. This function is called to instantiate
   * the resource, when it is needed. If this resource has any dependencies
   * of its own, they will be provided as a parameter.
   * @param opts Various options used to configure this resource.
   */
  provide<
    T,
    Name extends string,
    const Dependencies extends DependenciesOpt<Context>,
  >(
    name: Name,
    fn: ProvideFn<Context, T, Dependencies>,
    opts?: ProvideOpts<Context, T, Dependencies>,
  ): Provider<Provide<Context, T, Name, Dependencies>>;

  /**
   * Publishes an unpublished resource.
   *
   * When first defined, all resources are unpublished. This means that they
   * cannot be used by commands -- they can only be used as dependencies for
   * other resources, or by internal system mechanics. In order for commands
   * (user script) to use this resource, the resource must be published (made
   * public).
   *
   * @param name The name of the unpublished resource to be published.
   */
  publish<Name extends UnpublishedResources<Context>>(
    name: Name,
  ): Provider<Publish<Context, Name>>;

  /**
   * Finishes the configuration for this provider. The chained response
   * will no longer configure this entity. You will be able to begin a
   * new entity instead.
   */
  finish(): FreshStart<Context>;
}
