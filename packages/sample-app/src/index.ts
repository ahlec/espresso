// eslint-disable-next-line -- PnP doesn't play nicely with this when we do't include /index
import { espresso } from "espresso/src/index";
import Cache from "./resources/Cache";
import Logger from "./resources/Logger";
import Database from "./resources/Database";

export default espresso("sample")
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
