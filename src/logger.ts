// src/logger.ts

import pino, { LoggerOptions } from 'pino';

// Use `info` as our standard log level if not specified
const options: LoggerOptions = { level: process.env.LOG_LEVEL || 'info' };

// If we're doing `debug` logging, make the logs easier to read
if (options.level === 'debug') {
  options.transport = {
    target: 'pino-pretty',
    options: {
      colorize: true,
    },
  };
}

// Create and export a Pino Logger instance
export default pino(options);
