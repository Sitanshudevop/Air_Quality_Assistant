// ESLint flat configuration with strict code quality guardrails.
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import jsdoc from 'eslint-plugin-jsdoc';
import globals from 'globals';

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'coverage/**',
      'node_modules/**',
      '*.config.js',
      '*.config.ts',
      'scripts/**',
      '.github/**',
      'tests/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      jsdoc,
      custom: {
        rules: {
          'header-comment': {
            create(context) {
              return {
                Program(node) {
                  const comments = context.sourceCode.getAllComments();
                  if (comments.length === 0 || comments[0].loc.start.line !== 1) {
                    context.report({
                      node,
                      message:
                        'File must begin with a one-line header comment stating its responsibility.',
                    });
                  }
                },
              };
            },
          },
        },
      },
    },
    languageOptions: {
      ecmaVersion: 2022,
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        project: ['./tsconfig.json', './tsconfig.api.json'],
      },
    },
    rules: {
      'custom/header-comment': 'error',
      'max-lines': ['error', { max: 150, skipBlankLines: true, skipComments: true }],
      'max-lines-per-function': [
        'error',
        { max: 40, skipBlankLines: true, skipComments: true, IIFEs: true },
      ],
      'max-depth': ['error', { max: 3 }],
      'max-params': ['error', { max: 4 }],
      complexity: ['error', { max: 10 }],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/explicit-function-return-type': [
        'error',
        {
          allowExpressions: true,
          allowTypedFunctionExpressions: true,
        },
      ],
      'jsdoc/require-jsdoc': [
        'error',
        {
          publicOnly: true,
          require: {
            FunctionDeclaration: true,
            MethodDefinition: true,
            ClassDeclaration: true,
            ArrowFunctionExpression: true,
            FunctionExpression: true,
          },
        },
      ],
    },
  },
  {
    files: ['**/*.tsx'],
    rules: {
      'max-lines-per-function': [
        'error',
        { max: 80, skipBlankLines: true, skipComments: true },
      ],
    },
  },
  {
    files: ['**/*.test.ts', '**/*.test.tsx', 'src/test/**'],
    rules: {
      'max-lines-per-function': 'off',
      'max-lines': ['error', { max: 250, skipBlankLines: true, skipComments: true }],
      '@typescript-eslint/explicit-function-return-type': 'off',
      'jsdoc/require-jsdoc': 'off',
    },
  }
);
