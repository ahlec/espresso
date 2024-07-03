import Cache from "./Cache";
import UserDataSource, { User, isUser } from "./UserDataSource";

class UserService {
  public constructor(
    private readonly userDataSource: UserDataSource,
    private readonly cache: Cache,
  ) {}

  public async getUser(id: number): Promise<User | null> {
    // Check the cache first -- avoid the DB if we can!
    const cacheKey = `user:${id}`;
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return isUser(cached.value) ? cached.value : null;
    }

    // Load the user from the data source
    const user = await this.userDataSource.getById(id);
    this.cache.set(cacheKey, user);
    return user;
  }
}

export default UserService;
