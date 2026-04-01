/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "jsdom",

  roots: ["<rootDir>/src", "<rootDir>/tests"],

  testMatch: ["**/?(*.)+(spec|test).ts", "**/?(*.)+(spec|test).tsx"],

  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],

  transform: {
    "^.+\\.(ts|tsx)$": [
      "ts-jest",
      {
        tsconfig: "<rootDir>/tsconfig.json",
      },
    ],
  },

  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
  },

  setupFilesAfterEnv: ["<rootDir>/tests/setup.ts"],

  transformIgnorePatterns: [
    "/node_modules/(?!(@?react|react-dom|react-router-dom)/)",
  ],

  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/main.tsx",
    "!src/**/index.ts",
    "!src/msw/**",
  ],

  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html"],

  testPathIgnorePatterns: ["/node_modules/", "/dist/"],

  clearMocks: true,
  restoreMocks: true,
  verbose: true,
  testTimeout: 10000,
};
