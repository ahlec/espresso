import { Application } from "espresso/src/api/application";
import Cache from "./resources/Cache";
import Logger from "./resources/Logger";
import Database from "./resources/Database";

// eslint-disable-next-line
const app = {} as Application<{ resources: {} }>;

export default app
  .provide("logger", () => new Logger())
  .provide("database", ({ logger }) => new Database(logger), {
    dispose: (database) => database.dispose(),
    requires: ["logger"],
  })
  .provide("cache", ({ logger }) => new Cache(logger), {
    dispose: (cache) => cache.dispose(),
    requires: ["logger"],
  })
  .finish();
