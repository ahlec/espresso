import users from "./users";

export default users
  .cli("greet")
  .arg("id")
  .use("users")
  .use("logger")
  .main(async ({ args: [id], resources: { users, logger } }) => {
    logger.log("Starting...");
    logger.log("id:" + id);
    await users.greet(17);
    logger.log("Finished!");
  });
