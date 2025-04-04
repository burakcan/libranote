import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import prettierPlugin from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';

export default [
  js.configs.recommended,
  {
    files: ['**/*.ts'],
    plugins: {
      '@typescript-eslint': tseslint,
      'prettier': prettierPlugin,
    },
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        console: 'readonly',
        process: 'readonly',
      },
    },
    rules: {
      '@typescript-eslint/explicit-function-return-type': 'off',
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": ["error"],
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-console': ['warn', { 'allow': ['warn', 'error', 'info'] }],
      'prettier/prettier': 'error',
    },
  },
  prettierConfig,
]; 