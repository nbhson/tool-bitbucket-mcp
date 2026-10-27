import eslint from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";
import importPlugin from "eslint-plugin-import-x";
import globals from "globals";

/**
 * ESLint flat configuration for bitbucket-mcp-server.
 *
 * Extends TypeScript strict mode rules and enforces modern JS practices.
 */
export default [
  // ---------------------------------------------------------------
  // Base ignores
  // ---------------------------------------------------------------
  {
    ignores: ["build/**", "node_modules/**", "coverage/**", "*.js", "vitest.config.ts"],
  },

  // ---------------------------------------------------------------
  // TypeScript files
  // ---------------------------------------------------------------
  {
    files: ["**/*.ts"],

    languageOptions: {
      parser: tsparser,
      parserOptions: {
        sourceType: "module",
        project: "./tsconfig.json",
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        ...globals.node,
      },
      ecmaVersion: "latest",
    },

    plugins: {
      "@typescript-eslint": tseslint,
      "import-x": importPlugin,
    },

    rules: {
      // Base ESLint (JS) rules
      ...eslint.configs.recommended.rules,

      // TypeScript rules - strict
      ...tseslint.configs.strict.rules,

      // Consistent type imports
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],

      // Consistent type exports
      "@typescript-eslint/consistent-type-exports": [
        "error",
        { fixMixedExportsWithInlineTypeSpecifier: true },
      ],

      // No require statements (use ESM)
      "@typescript-eslint/no-require-imports": "error",

      // No empty interfaces (use type aliases)
      "@typescript-eslint/no-empty-interface": ["error", { allowSingleExtends: true }],

      // No non-null assertion in conditional
      "@typescript-eslint/no-non-null-assertion": "warn",

      // No explicit any
      // Disabled: this is an API client that works with untyped Bitbucket API responses.
      // Using `any` here is intentional and necessary for API boundary layers.
      "@typescript-eslint/no-explicit-any": "off",

      // No unused variables
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
        },
      ],

      // Consistent naming conventions
      "@typescript-eslint/naming-convention": [
        "error",
        {
          selector: "function",
          format: ["camelCase", "PascalCase"],
          leadingUnderscore: "allow",
          trailingUnderscore: "forbid",
        },
        {
          selector: "variable",
          format: ["camelCase", "UPPER_CASE", "PascalCase", "snake_case"],
          leadingUnderscore: "allow",
          trailingUnderscore: "forbid",
        },
        {
          selector: "parameter",
          format: ["camelCase", "snake_case"],
          leadingUnderscore: "allow",
          trailingUnderscore: "forbid",
        },
        {
          selector: "property",
          // Object literal properties include HTTP headers (`X-Atlassian-Token`),
          // env var keys (`BITBUCKET_URL`) and dunder internals (`__retryCount`).
          format: ["camelCase", "snake_case", "UPPER_CASE", "PascalCase"],
          leadingUnderscore: "allow",
          trailingUnderscore: "forbid",
        },
        {
          selector: "objectLiteralProperty",
          format: null, // external contracts: HTTP headers, env keys, wire payloads
        },
        {
          selector: "typeProperty",
          format: null, // matches external API shapes (e.g. `__retryCount`)
        },
        {
          selector: "typeAlias",
          format: ["PascalCase"],
        },
        {
          selector: "typeParameter",
          format: ["PascalCase"],
        },
      ],

      // Import organization
      "import-x/order": [
        "error",
        {
          groups: [
            ["builtin", "external"],
            ["internal", "parent", "sibling", "index"],
          ],
          "newlines-between": "always",
          alphabetize: {
            order: "asc",
            caseInsensitive: true,
          },
        },
      ],

      // No duplicate imports
      "import-x/no-duplicates": "error",

      // Consistent dot notation
      "dot-notation": "error",

      // No var
      "no-var": "error",

      // Prefer const
      "prefer-const": "error",

      // Prefer spread over concat
      "prefer-spread": "error",

      // Consistent return statements
      "consistent-return": "error",

      // No trailing spaces
      "no-trailing-spaces": ["error", { skipBlankLines: true }],

      // No duplicate keys in objects
      "no-dupe-keys": "error",

      // No duplicate case labels
      "no-duplicate-case": "error",

      // No empty blocks
      "no-empty": "error",

      // No unreachable code
      "no-unreachable": "error",

      // Comparison with boolean
      "no-constant-binary-expression": "error",

      // Prefer explicit boolean conversion
      eqeqeq: ["error", "always"],

      // No with statement
      "no-with": "error",
    },
  },

  // ---------------------------------------------------------------
  // Test files - relaxed rules
  // ---------------------------------------------------------------
  {
    files: ["src/**/*.test.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/consistent-type-imports": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/consistent-type-exports": "off",
      "@typescript-eslint/no-require-imports": "off",
      "no-undef": "off",
      "import-x/no-duplicates": "off",
      "import-x/order": "off",
    },
  },
];
