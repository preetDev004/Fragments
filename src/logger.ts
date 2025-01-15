// src/logger.ts

import * as pino from 'pino';

// Use `info` as our standard log level if not specified
const options: pino.LoggerOptions = { level: process.env.LOG_LEVEL || 'info' };

// If we're doing `debug` logging, make the logs easier to read
if (options.level === 'debug') {
  options.transport = {
    target: 'pino-pretty',
    options: {
      colorize: true,
    },
  };

  const debugLogger = pino.pino(options);
  debugLogger.debug(JSON.stringify(process.env, null, 2), 'Environment variables');
}

// Create and export a Pino Logger instance
export default pino.pino(options);
