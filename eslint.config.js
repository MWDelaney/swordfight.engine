import js from '@eslint/js';
import globals from 'globals';

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        console: 'readonly',
        document: 'readonly',
        window: 'readonly',
        localStorage: 'readonly',
        CustomEvent: 'readonly'
      }
    },
    rules: {
      // Code quality rules
      'no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_'
      }],
      'no-console': 'off', // Allow console for game logging
      'no-debugger': 'error',
      'no-alert': 'error',

      // Best practices
      'eqeqeq': ['error', 'always'],
      'curly': 'error',
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-throw-literal': 'error',

      // Style rules
      'indent': ['error', 2],
      'quotes': ['error', 'single', { allowTemplateLiterals: true }],
      'semi': ['error', 'always'],
      'comma-dangle': ['error', 'never'],
      'object-curly-spacing': ['error', 'always'],
      'array-bracket-spacing': ['error', 'never'],
      'space-before-function-paren': ['error', 'never'],

      // ES6+ specific
      'prefer-const': 'error',
      'no-var': 'error',
      'prefer-arrow-callback': 'error',
      'arrow-spacing': 'error',
      'template-curly-spacing': ['error', 'never']
    }
  },
  {
    files: ['**/*.js'],
    ignores: [
      'node_modules/**',
      'dist/**',
      'build/**',
      '*.min.js'
    ]
  }
];
