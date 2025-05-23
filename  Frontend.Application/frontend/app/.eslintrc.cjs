module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
    node: true,
    jest: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime', // For new JSX transform
    'plugin:react-hooks/recommended',
    'plugin:@typescript-eslint/recommended',
    // 'plugin:@typescript-eslint/recommended-requiring-type-checking', // Consider adding for stricter rules
    'plugin:i18next/recommended',
    'plugin:prettier/recommended', // Must be last
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: './tsconfig.json', // Required for some TS-ESLint rules
  },
  plugins: [
    'react',
    'react-hooks',
    '@typescript-eslint',
    'i18next',
    'prettier',
    'react-refresh'
  ],
  rules: {
    'prettier/prettier': [
      'warn',
      {
        endOfLine: 'auto',
      },
    ],
    'react/prop-types': 'off', // Using TypeScript for prop types
    'react/react-in-jsx-scope': 'off', // Not needed with new JSX transform
    '@typescript-eslint/explicit-module-boundary-types': 'off', // Can be enabled for stricter typing
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    'i18next/no-literal-string': 'off', // Might be too strict for initial setup, configure as needed
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  ignorePatterns: ['dist', 'node_modules', '*.cjs', '*.js'], // Ignore .cjs files at the root like this one
};