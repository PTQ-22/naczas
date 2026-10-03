// @ts-check
import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import expoConfig from 'eslint-config-expo/flat.js';
import prettierConfig from 'eslint-config-prettier/flat';
import importPlugin from 'eslint-plugin-import';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const MOBILE = 'apps/mobile';

// eslint-config-expo registers the plugin object from `flatConfigs` (not the module default export);
// flat config refuses two different objects under the same name, so reuse that exact instance.
const importPluginInstance = importPlugin.flatConfigs.recommended.plugins.import;

// eslint-config-expo is written for a single-app repo (its blocks have no or root-relative `files`).
// Re-scope every block to apps/mobile so React/RN rules don't leak into api and packages.
const expoForMobile = expoConfig.map((block) => ({
  ...block,
  files: (block.files ?? ['**/*']).map((pattern) =>
    typeof pattern === 'string'
      ? `${MOBILE}/${pattern.startsWith('**/') ? pattern : `**/${pattern}`}`
      : pattern,
  ),
}));

export default defineConfig([
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/coverage/**',
      '**/web-build/**',
      '**/.expo/**',
      '**/expo-env.d.ts',
      `${MOBILE}/ios/**`,
      `${MOBILE}/android/**`,
    ],
  },

  js.configs.recommended,
  ...expoForMobile,

  {
    files: ['**/*.{ts,tsx}'],
    extends: [tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/ban-ts-comment': [
        'error',
        { 'ts-ignore': true, 'ts-nocheck': true, 'ts-expect-error': 'allow-with-description' },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },

  {
    plugins: { import: importPluginInstance },
    settings: {
      'import/resolver': {
        typescript: {
          project: ['apps/*/tsconfig.json', 'packages/*/tsconfig.json'],
          noWarnOnMultipleProjects: true,
        },
        node: true,
      },
    },
    rules: {
      'import/no-cycle': 'error',
      'import/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', ['parent', 'sibling', 'index'], 'type'],
          pathGroups: [
            { pattern: '@naczas/**', group: 'internal', position: 'before' },
            { pattern: '@/**', group: 'internal' },
          ],
          pathGroupsExcludedImportTypes: ['builtin'],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
      'no-console': 'warn',
    },
  },

  // Node-side code: API server, pure packages, and tool configs.
  {
    files: ['apps/api/**', 'packages/**', '*.{js,mjs,cjs}', `${MOBILE}/*.{js,cjs}`],
    languageOptions: { globals: globals.node },
  },
  {
    // The API is a server process — logging to stdout is its job.
    files: ['apps/api/**'],
    rules: { 'no-console': 'off' },
  },
  {
    files: ['**/*.{js,mjs,cjs}'],
    extends: [tseslint.configs.disableTypeChecked],
  },

  // Must be last: turns off stylistic rules that Prettier owns.
  prettierConfig,
]);
