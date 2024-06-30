import users from "./users";

export default users
  .cli("greet")
  .arg("id")
  .arg("name", { optional: true })
  .arg("lastname", { optional: true })
  .use("users")
  .use("logger")
  .flag("-r")
  .flag("--force", { aliases: ["-f"] })
  .flag("--dryrun", { aliases: ["--dry-run", "--dryRun"] })
  .flag("--verbose", { aliases: ["-v", "-V"] })
  .flag("--token")
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
