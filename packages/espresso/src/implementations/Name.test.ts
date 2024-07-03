import { Name, NameType } from "./Name";

const INVALID_NAMES: readonly string[] = [
  "",
  " hello",
  "hello world",
  "asdf?",
  "as?df",
  "hello!!",
  "w!ld",
  "w!ld?",
  "hello-world!",
];

const VALID_NAMES: readonly string[] = [
  "hello",
  "hello-world",
  "hello_world",
  "a",
  "git.config",
];

describe("Name", () => {
  describe("start", () => {
    test.each(INVALID_NAMES)(
      "invalid name '%s' should throw an error",
      (name) => {
        expect(() => Name.start(name)).toThrow();
      },
    );

    test.each(VALID_NAMES)(
      "valid name '%s' should not throw an error",
      (name) => {
        expect(() => Name.start(name)).not.toThrow();
      },
    );
  });

  describe("chain", () => {
    test.each(INVALID_NAMES)(
      "invalid name '%s' should throw an error",
      (name) => {
        const current = Name.start("test");
        expect(() => current.chain(name, "command")).toThrow();
      },
    );

    test.each(VALID_NAMES)(
      "valid name '%s' should not throw an error",
      (name) => {
        const current = Name.start("test");
        expect(() => current.chain(name, "command")).not.toThrow();
      },
    );

    it("should append the provided name to the list of subcommands", () => {
      const foo = Name.start("test").chain("foo", "command");
      expect(foo.subcommands).toEqual(["foo"]);

      const bar = foo.chain("bar", "command");
      expect(bar.subcommands).toEqual(["foo", "bar"]);

      const baz = bar.chain("baz", "command");
      expect(baz.subcommands).toEqual(["foo", "bar", "baz"]);
    });

    it("should not mutate the current instance", () => {
      const orig = Name.start("test");
      orig.chain("foo", "command");
      expect(orig.program).toBe("test");
      expect(orig.subcommands).toEqual([]);
      expect(orig.type).toBe<NameType>("program");
    });
  });
});
