import Database from "./Database";

export interface User {
  id: number;
  firstName: string;
  lastName: string;
}

export function isUser(obj: unknown): obj is User {
  if (typeof obj !== "object" || Array.isArray(obj) || obj === null) {
    return false;
  }

  return "id" in obj && typeof obj.id === "number";
}

class UserDataSource {
  public constructor(private readonly database: Database) {}

  public async getById(id: number): Promise<User | null> {
    const dbUser = await this.database.query(
      `SELECT * FROM user WHERE id = '${id}'`,
    );

    if (!dbUser) {
      return null;
    }

    return {
      id: dbUser.id,
      firstName: dbUser.first_name,
      lastName: dbUser.last_name,
    };
  }
}

export default UserDataSource;
