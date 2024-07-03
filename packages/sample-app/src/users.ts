import app from "./index";
import UserDataSource from "./resources/UserDataSource";
import UserService from "./resources/UserService";

export default app
  .group("users")
  .provide("user_datasource", ({ database }) => new UserDataSource(database), {
    requires: ["database"],
  })
  .provide(
    "users",
    ({ cache, user_datasource }) => new UserService(user_datasource, cache),
    { requires: ["cache", "user_datasource"] },
  )
  .publish("users")
  .finish();
