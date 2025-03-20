import { FlatCompat } from "@eslint/eslintrc";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.config({
    extends: ["next/core-web-vitals", "next/typescript"],
    plugins: ["sort"],
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          caughtErrors: "none",
        },
      ],
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
    }
  })
  // ...compat.extends("next/core-web-vitals", "next/typescript"),
];

export default eslintConfig;
