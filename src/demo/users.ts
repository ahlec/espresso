import espresso, { Cache, Database, Logger } from "./index";

interface User {
  id: number;
  name: string;
}

class UserDataSource {
  public constructor(
    private readonly cache: Cache,
    private readonly database: Database,
  ) {}

  public async getUser(id: number): Promise<User | null> {
    const name = await this.database.queryUserName(id);
    if (!name) {
      return null;
    }

    const user: User = { id, name };
    this.cache.put(`user:${id}`, user);
    return user;
  }
}

class UserService {
  public constructor(
    private readonly dataSource: UserDataSource,
    private readonly logger: Logger,
  ) {}

  public async greet(id: number): Promise<void> {
    const user = await this.dataSource.getUser(id);
    this.logger.log(user ? `Hello, ${user.name}!` : `Hello stranger!!`);
  }
}

const users = espresso
  .group("users")
  .provide(
    "user_datasource",
    ({ database, cache }) => new UserDataSource(cache, database),
    { dispose: (x) => {}, requires: ["database", "cache"] },
  )
  .provide(
    "users",
    ({ user_datasource, logger }) => new UserService(user_datasource, logger),
    { requires: ["user_datasource", "logger"] },
  )
  .publish("users")
  .seal();

export default users;
