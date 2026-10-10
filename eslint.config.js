// ESLint flat config — cakupan: server/ (CommonJS, Node) + client/src/ (ESM, Browser/React).
const globals = require("globals");

module.exports = [
  {
    ignores: ["node_modules/", "client/node_modules/", "client/dist/", "data/"],
  },
  {
    files: ["server/**/*.js"],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: "commonjs",
      globals: globals.node,
    },
    rules: {
      "no-unused-vars": "warn",
      "no-console": "off",
    },
  },
  {
    files: ["client/src/**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: "module",
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: globals.browser,
    },
    rules: {
      "no-unused-vars": "warn",
      "no-console": "warn",
    },
  },
];
