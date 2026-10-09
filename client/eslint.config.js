import { globSync, readFileSync } from 'node:fs'
import js from '@eslint/js'
import prettier from 'eslint-config-prettier'
import { defineConfig } from 'eslint/config'
import pluginVue from 'eslint-plugin-vue'
import tseslint from 'typescript-eslint'
import vueParser from 'vue-eslint-parser'

// Type-aware rules need a TypeScript script block; template-only components have none.
const vueFilesWithoutTs = globSync('src/**/*.vue', { cwd: import.meta.dirname }).filter(
  (file) => !/<script[^>]*\blang=["']ts["']/.test(readFileSync(file, 'utf8')),
)

export default defineConfig(
  { ignores: ['dist', 'coverage', 'node_modules', 'test-results', 'playwright-report'] },
  js.configs.recommended,
  pluginVue.configs['flat/recommended'],
  {
    files: ['**/*.{ts,vue}'],
    extends: [tseslint.configs.strictTypeChecked],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
        extraFileExtensions: ['.vue'],
      },
    },
    rules: {
      // TypeScript already reports undefined names, including browser globals.
      'no-undef': 'off',
      // typescript-eslint only sees fallback types with some `any`s for .vue
      // imports, which would flag idiomatic code like `createApp(App)` or
      // route components.
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
      'vue/multi-word-component-names': 'off',
    },
  },
  {
    // typescript-eslint replaces the parser; .vue files need the Vue parser on top of it.
    files: ['**/*.vue'],
    languageOptions: { parser: vueParser, parserOptions: { parser: tseslint.parser } },
  },
  {
    files: vueFilesWithoutTs,
    extends: [tseslint.configs.disableTypeChecked],
    rules: { '@typescript-eslint/prefer-optional-chain': 'off' },
  },
  {
    // Fixtures are known data; asserting their presence keeps tests readable.
    files: ['tests/**/*.ts', 'e2e/**/*.ts'],
    rules: { '@typescript-eslint/no-non-null-assertion': 'off' },
  },
  prettier,
)
