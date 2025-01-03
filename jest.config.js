require('dotenv').config()

/** @type {import('ts-jest').JestConfigWithTsJest} */
const { defaultsESM: tsjPreset } = require('ts-jest/presets')

module.exports = {
  //preset: 'ts-jest',
  testEnvironment: 'node',
  // moduleNameMapper: {
  //   "^~/(.*)$": "<rootDir>/src/$1",
  //   "^src/(.*)$": "<rootDir>/src/$1",
  // },
  transform: {
    //...tsjPreset.transform,
    '^.+\\.m?[tj]sx?$': [
      "ts-jest",
      {
        isolatedModules: true,
        // useESM: true,~
      },
    ],
  },
  testTimeout: 18000000,
  // transformIgnorePatterns: ['<rootDir>/node_modules/(?!(file-type|strtok3|peek-readable|token-types|serialize-error|strip-ansi|string-width|ansi-regex)@)']
};