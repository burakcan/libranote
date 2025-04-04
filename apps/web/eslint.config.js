import js from "@eslint/js";
import globals from "globals";
import importPlugin from 'eslint-plugin-import';
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import sort from "eslint-plugin-sort";

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      sort: sort,
      import: importPlugin,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],

      "import/newline-after-import": ["error"],

      "sort/imports": [
        "error",
        {
          "groups": [
            { "type": "side-effect", "order": 10 },
            { "type": "dependency", "order": 20 },
            { "regex": "^@/components/ui/", "order": 30 },
            { "regex": "^@/components/", "order": 40 },
            { "regex": "^@/hooks/", "order": 40 },
            { "regex": "^@/services/", "order": 50 },
            { "regex": "^@/lib/", "order": 60 },
            { "type": "other", "order": 70 },
            { "regex": "\\.(png|jpg|svg)$", "order": 80 }
          ]
        }
      ]
    },
  },
)
