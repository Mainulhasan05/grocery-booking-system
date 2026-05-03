module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  verbose: true,
  testTimeout: 30000,
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/config/logger.js',
    '!src/config/swagger.js',
  ],
};
