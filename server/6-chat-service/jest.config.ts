/* @ Each service is going to have one test file and that test file will
 * have multiple functions or describe test for different functions,
 * but only one test per service.
 */

import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
  // Because we're running on TS, we need to set the presets
  preset: 'ts-jest',
  // Environment can be `node` or the `browser`. For frontend i.e browser,
  // its `jsdom` and for the backend its `node`
  testEnvironment: 'node',
  // If we want to see more information on the console, verbose should be true
  verbose: true,
  // ITs going to create a folder called 'coverage' and then collect coverage
  coverageDirectory: 'coverage',
  // collectCoverage -> Either it can be set it on package.json or here
  collectCoverage: true,
  // We want JEST to ignore testing the node modules
  testPathIgnorePatterns: ['/node_modules'],
  // So for the backend, since our transform is the TS file, we want it to
  // transform with `ts-jest` for any files with the `.ts` extension
  transform: {
    '^.+\\.ts?$': 'ts-jest'
  },
  // How do we want to match the test files
  // Go inside root's src folder and check inside every subfolder in src and
  // look for any folder called test and then run any file with the extension
  // `.ts`
  testMatch: ['<rootDir>/src/**/test/*.ts'],
  // Where do we want to collect our test coverage
  // i.e get it from the src, the files there `.ts` and dont check test files
  // inside the test folder and also dont check the node modules. Only our
  // files inside the folder, any folder in the src with the `.ts` extension.
  // And then its going to compare it with the test that we've written.
  collectCoverageFrom: ['src/**/*.ts', '!src/**/test/*.ts?(x)', '!**/node_modules/**'],
  // Do we want to check condition.
  // So if we have conditions inside our functions, if we have functions, all
  // the lines, we want to check statements
  // i.e If we have a function, how do we want it to check for the coverage.
  // Does it check every line, does it check every condition we have like
  // if else elseif statements.
  coverageThreshold: {
    global: {
      branches: 1,
      functions: 1,
      lines: 1,
      statements: 1
    }
  },
  // code coverage reporters is important. Maybe we decide to send our code
  // coverage to a code coverage tool to view.
  coverageReporters: ['text-summary', 'lcov'],
  // In our files, we're importing with `@auth`. So we need to let
  // JEST know about our paths as well.
  // i.e if it sees a path with @auth, it should be able to understand
  // that path or map the path appropriately.
  moduleNameMapper: {
    '@chat/(.*)': ['<rootDir>/src/$1']
  }
};

export default config;
