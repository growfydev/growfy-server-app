module.exports = {
  parser: '@typescript-eslint/parser', // Use the TypeScript parser
  parserOptions: {
    project: 'tsconfig.json',
    tsconfigRootDir: __dirname,
    sourceType: 'module',
  },
  env: {
    node: true,
    jest: true,
    es2020: true, // Provides modern ES features
  },
  plugins: [
    '@typescript-eslint',
    'prettier' // Integrates Prettier as an ESLint plugin
  ],
  extends: [
    'plugin:@typescript-eslint/recommended', // Recommended TypeScript rules
    'plugin:prettier/recommended' // Enforces Prettier formatting rules
  ],
  ignorePatterns: [
    '.eslintrc.js', // Ignore this file if preferred
    'dist', // Commonly ignored build output directories
  ],
  rules: {
    // ---- GENERAL ESLINT RULES ----
    // Recommended to keep code clean and avoid common pitfalls
    'no-unused-vars': 'off', // Turn off base rule as it's handled by @typescript-eslint
    'no-shadow': 'off', // Turn off base rule as it's handled by @typescript-eslint

    // ---- TYPESCRIPT-ESLINT RULES ----
    '@typescript-eslint/no-unused-vars': ['error'], // Catch unused variables
    '@typescript-eslint/no-explicit-any': 'warn',    // Encourage avoiding 'any', but not a strict error
    '@typescript-eslint/explicit-function-return-type': 'off', // Relax requirement for return types
    '@typescript-eslint/explicit-module-boundary-types': 'off', // Relax explicit return types at module boundaries

    // ---- PRETTIER RULE ----
    // 'prettier/prettier' rule is automatically configured by `plugin:prettier/recommended`.
    // If you need to override Prettier settings, you can do so in `.prettierrc`.

    // ---- OTHER LOGICAL / STYLE RULES ----
    // Add any additional ESLint rules you want that do not conflict with Prettier's formatting.
  },
};
