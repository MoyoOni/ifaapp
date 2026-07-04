module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    // P3-01: use logger (shared/utils/logger.ts) instead of console.* directly,
    // so log level, context tagging, and prod/dev gating stay consistent.
    'no-console': 'error',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    'no-restricted-properties': ['error', {
      object: 'Math',
      property: 'random',
      message: 'Use seededRandom() from @/shared/utils/seeded-random instead of Math.random() to prevent data flickering.',
    }],
    'no-restricted-globals': ['error', {
      name: 'alert',
      message: 'Use useToast() from @/components/common/ToastProvider instead of alert().',
    }, {
      name: 'confirm',
      message: 'Use useConfirm() from @/hooks/use-confirm or useModal() from @/components/common/ModalProvider instead of confirm().',
    }, {
      name: 'prompt',
      message: 'Use a form dialog instead of prompt().',
    }],
    'no-restricted-syntax': [
      'error',
      {
        selector: "Literal[value=/\\b(text|bg|border)-(red|green|blue|yellow|purple|pink|indigo|orange|amber|emerald|teal|sky|violet|fuchsia|rose|lime|cyan|stone|gray|slate|zinc)-(50|100|200|300|400|500|600|700|800|900)\\b/]",
        message: "Use design tokens instead of hardcoded Tailwind colors to ensure consistent theming.",
      }
    ],
  },
  overrides: [
    {
      // logger.ts is the one place console.* is the actual implementation.
      files: ['src/shared/utils/logger.ts'],
      rules: { 'no-console': 'off' },
    },
  ],
};