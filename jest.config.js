// Jest config for BetterMind (runs through next/jest so JSX/ESM in src/ is compiled
// the same way Next compiles it). Tests never touch the real database or the real AI API:
// Mongo is an in-memory server started once in globalSetup, and the AI client is mocked per test.
const nextJest = require('next/jest');

const createJestConfig = nextJest({ dir: './' });

const customConfig = {
  testEnvironment: 'node',
  testMatch: ['<rootDir>/tests/**/*.test.js'],
  globalSetup: '<rootDir>/tests/setup/globalSetup.js',
  globalTeardown: '<rootDir>/tests/setup/globalTeardown.js',
  setupFiles: ['<rootDir>/tests/setup/env.js'],
  testTimeout: 30000,
};

// `jose` (edge middleware) and `otplib` (+ its @noble/@scure deps) ship ESM only, and Jest skips node_modules by default,
// so let Jest transform them. next/jest always re-adds its own ignore patterns, so override afterwards.
module.exports = async () => {
  const config = await createJestConfig(customConfig)();
  config.transformIgnorePatterns = ['/node_modules/(?!(jose|otplib|@otplib|@noble|@scure)/)', '^.+\\.module\\.(css|sass|scss)$'];
  return config;
};
