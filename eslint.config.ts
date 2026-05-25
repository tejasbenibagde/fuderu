import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts}"],
    plugins: { js },
    extends: ["js/recommended"],
    languageOptions: { globals: globals.browser },
  },
  tseslint.configs.recommended,
  globalIgnores([
    "dist",
    "build",
    "playground",
    "**/dist/**",
    "**/build/**",
    "**/.docusaurus/**",
    "**/.cache/**",
    "**/*.d.ts",
    "**/node_modules/**",
  ]),
]);
