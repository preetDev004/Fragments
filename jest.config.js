import * as path from 'path';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get the full path to our env.jest file
const envFile = path.join(__dirname, 'env.jest');

// Read the environment variables we use for Jest from our env.jest file
dotenv.config({ path: envFile });

// Log a message to remind developers how to see more detail from log messages
console.log(`Using LOG_LEVEL=${process.env.LOG_LEVEL}. Use 'debug' in env.jest for more detail`);

/** @type {import('ts-jest').JestConfigWithTsJest} */
const config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: [
    '**/__tests__/**/*.+(ts|tsx|js)',
    '**/?(*.)+(spec|test).+(ts|tsx|js)'
  ],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  globals: {
    'ts-jest': {
      useESM: true, // Enable ESM support in ts-jest
    },
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  verbose: true,
  testTimeout: 5000,
};

export default config;
