import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'
import stylistic from '@stylistic/eslint-plugin'
import vue from 'eslint-plugin-vue'
import astro from 'eslint-plugin-astro'
import { defineConfig } from 'eslint/config'
import importNewlines from 'eslint-plugin-import-newlines'
import astroParser from 'astro-eslint-parser'
import vueParser from 'vue-eslint-parser'

export default defineConfig([
  { ignores: ['**/*.d.ts', '**/dist/**', '**/node_modules/**', '**/components/ui/**', '**/.astro/**'] },

  eslint.configs.recommended,
  ...tseslint.configs.recommended,

  stylistic.configs.customize({
    indent: 2,
    quotes: 'single',
    semi: false,
  }),

  ...vue.configs['flat/essential'],
  ...vue.configs['flat/recommended'],

  ...astro.configs['flat/recommended'],

  {
    plugins: {
      'import-newlines': importNewlines,
    },
    languageOptions: {
      globals: {
        console: 'readonly',
        document: 'readonly',
        window: 'readonly',
      },
    },
    rules: {
      'import-newlines/enforce': ['error', { 'items': 2, 'max-len': 120 }],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-console': 'off',
      'vue/multi-word-component-names': 'off',
    },
  },

  {
    files: ['**/*.vue'],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tseslint.parser,
        project: ['./tsconfig.json', './tsconfig.app.json'],
        extraFileExtensions: ['.vue'],
      },
    },
  },

  {
    files: ['**/*.astro'],
    languageOptions: {
      parser: astroParser,
    },
  },
])
