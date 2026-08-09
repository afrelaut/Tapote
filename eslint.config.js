import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";

export default [
  // .claude/worktrees contient des copies complètes du dépôt : les linter ferait
  // remonter les mêmes fichiers plusieurs fois. Les dossiers output/ et tmp/
  // sont eux aussi produits par les audits navigateur et ne font pas partie du
  // code source livré.
  { ignores: ["dist", "coverage", "data", "output", "tmp", ".claude/worktrees", "livrables"] },
  js.configs.recommended,
  {
    files: ["**/*.{js,jsx,mjs}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: { ...globals.browser, ...globals.node },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: { "react-hooks": reactHooks, "react-refresh": reactRefresh },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
    },
  },
];
