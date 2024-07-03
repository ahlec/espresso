import Logger from "./Logger";

type AllowedSqlStatements = `SELECT * FROM user WHERE id = '${number}'`;

interface DbUser {
  id: number;
  first_name: string;
  last_name: string;
}

class Database {
  private readonly userTable: readonly DbUser[] = [
    {
      id: 1,
      first_name: "Bob",
      last_name: "Belcher",
    },
    {
      id: 2,
      first_name: "Linda",
      last_name: "Belcher",
    },
    {
      id: 3,
      first_name: "Hugo",
      last_name: "Habercore",
    },
    {
      id: 4,
      first_name: "Phillip",
      last_name: "Frond",
    },
  ];

  public constructor(private readonly logger: Logger) {}

  public query(query: AllowedSqlStatements): Promise<DbUser | null> {
    const match = query.match(/^SELECT \* FROM user WHERE id = '(\d+)'$/);
    if (!match) {
      return Promise.resolve(null);
    }

    const [, idStr] = match;
    const id = parseInt(idStr, 10);
    if (isNaN(id)) {
      return Promise.resolve(null);
    }

    return Promise.resolve(
      this.userTable.find((user) => user.id === id) ?? null,
    );
  }

  public dispose(): void {
    this.logger.writeLine("database.dispose()");
  }
}

export default Database;
