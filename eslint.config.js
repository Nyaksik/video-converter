import eslint from '@eslint/js'
import stylistic from '@stylistic/eslint-plugin'
import astroParser from 'astro-eslint-parser'
import astro from 'eslint-plugin-astro'
import importNewlines from 'eslint-plugin-import-newlines'
import perfectionist from 'eslint-plugin-perfectionist'
import unusedImports from 'eslint-plugin-unused-imports'
import vue from 'eslint-plugin-vue'
import { defineConfig } from 'eslint/config'
import tseslint from 'typescript-eslint'
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
      'unused-imports': unusedImports,
      'perfectionist': perfectionist,
    },
    languageOptions: {
      globals: {
        console: 'readonly',
        document: 'readonly',
        window: 'readonly',
        process: 'readonly',
      },
    },
    rules: {
      'import-newlines/enforce': ['error', {
        'items': 2,
        'max-len': 120,
      }],
      '@stylistic/object-curly-newline': ['error', {
        ObjectExpression: {
          multiline: true,
          minProperties: 2,
        },
        ObjectPattern: {
          multiline: true,
          minProperties: 3,
        },
        ExportDeclaration: {
          multiline: true,
          minProperties: 3,
        },
      }],
      '@stylistic/object-property-newline': ['error', { allowAllPropertiesOnSameLine: false }],
      '@stylistic/max-len': ['error', {
        code: 120,
        ignoreUrls: true,
        ignoreStrings: true,
        ignoreTemplateLiterals: true,
        ignoreRegExpLiterals: true,
        ignoreComments: true,
        ignorePattern: 'class=',
      }],
      'unused-imports/no-unused-imports': 'error',
      'perfectionist/sort-imports': ['error', {
        type: 'natural',
        groups: [
          'builtin',
          'external',
          'internal',
          'parent',
          'sibling',
          'index',
          'type',
        ],
        internalPattern: ['^@/.*'],
      }],
      'perfectionist/sort-named-imports': ['error', { type: 'natural' }],
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
    languageOptions: { parser: astroParser },
    rules: {
      '@stylistic/jsx-tag-spacing': 'off',
      '@stylistic/jsx-one-expression-per-line': 'off',
      '@stylistic/indent-binary-ops': 'off',
    },
  },
])
