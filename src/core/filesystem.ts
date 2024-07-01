import { existsSync, readdirSync } from "fs";
import path from "path";

export interface Filesystem {
  exists(filename: string): boolean;

  /**
   * @returns Array of ABSOLUTE filenames
   */
  readdir(directory: string): readonly string[];
}

export class LocalFilesystem implements Filesystem {
  public exists(filename: string): boolean {
    return existsSync(filename);
  }

  public readdir(directory: string): readonly string[] {
    return readdirSync(directory).map((name) => path.resolve(directory, name));
  }
}
