import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testRegex: "src/.*\\.test\\.ts$",
};

export default config;
