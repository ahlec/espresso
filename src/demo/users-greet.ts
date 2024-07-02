import users from "./users";

export default users
  .cli("greet")
  .arg("id", "The user's unique ID")
  .arg("name", {
    description: "The first name (or full name) of the user to greet.",
    optional: true,
  })
  .arg("lastname", {
    description: "The last name of the user.",
    optional: true,
  })
  .use("users")
  .use("logger")
  .flag("-r")
  .flag("--force", { aliases: ["-f"] })
  .flag("--dryrun", {
    description: "If specified, does not send the greeting to the user",
    aliases: ["--dry-run", "--dryRun"],
  })
  .flag("--verbose", {
    description: "Prints all debug messages",
    aliases: ["-v", "-V"],
  })
  .flag("--token", { description: "The API token for the email service" })
  .main(
    async ({
      args: [id, name, lastname],
      flags,
      resources: { users, logger },
    }) => {
      const verbose = flags.verbose === true;
      if (verbose) {
        console.log(flags);
      }

      logger.log("Starting...");
      logger.log("id:" + id);
      await users.greet(17);
      logger.log("Finished!");
    },
  );
