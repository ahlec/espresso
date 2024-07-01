import users from "./users";

export default users
  .cli("users")
  .use("logger")
  .main(({ resources: { logger } }) => {
    logger.log("Hello world!");
    logger.log("Default action for the `users` subgroup");
  });
