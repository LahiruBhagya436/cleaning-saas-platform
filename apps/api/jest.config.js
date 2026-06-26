/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  testMatch: ['<rootDir>/src/**/*.test.ts'],
  moduleNameMapper: {
    '^@cleaning/types$': '<rootDir>/../../packages/types/src',
  },
  collectCoverageFrom: ['src/**/*.ts', '!src/server.ts', '!src/jobs/**'],
  coverageDirectory: '<rootDir>/coverage',
  clearMocks: true,
  resetMocks: true,
}
