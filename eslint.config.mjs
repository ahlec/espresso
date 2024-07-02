// @ts-check

import pluginAhlec from "@ahlec/eslint-plugin";
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    ignores: [".yarn/**/*", ".pnp.*", "dist/**/*"],
  },
  {
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      // eslint-disable-next-line -- Missing correct types on this package right now
      "@ahlec": pluginAhlec,
    },
    settings: {
      "ahlec/aliases": {
        "@espresso/*": "./packages/espresso/src/*",
      },
    },
  },
  {
    rules: {
      "no-await-in-loop": "error",
      "no-constructor-return": "error",
      "no-template-curly-in-string": "error",
      eqeqeq: "error",
      "@ahlec/no-dot-import": "error",
      "@ahlec/no-extraneous-index": "error",
      "@ahlec/prefer-alias-for-parent-import": "error",
      "@ahlec/prefer-relative-for-nested-import": "error",
    },
  },
);
