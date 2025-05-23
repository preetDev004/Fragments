import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import pino from 'pino-http';
import { author, version } from '../package.json';
import logger from './logger';
import routes from './routes';
import passport from 'passport';
import authModule from './auth/index';
import { createErrorResponse } from './response';
interface AppError extends Error {
  status?: number;
}

const app = express();

// Use pino logging middleware
app.use(pino({ logger }));

// Use helmetjs security middleware
app.use(helmet());

// Use CORS middleware so we can make requests across origins
app.use(cors());

// Use gzip/deflate compression middleware
app.use(compression({ threshold: 0 }));

passport.use(authModule.strategy());
app.use(passport.initialize());

app.use('/', routes);

// Define a simple health check route. If the server is running
// we'll respond with a 200 OK.  If not, the server isn't healthy.
app.get('/', (req, res) => {
  // Clients shouldn't cache this response (always request it fresh)
  // See: https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching#controlling_caching
  res.setHeader('Cache-Control', 'no-cache');

  // Send a 200 'OK' response with info about our repo
  res.status(200).json({
    status: 'ok',
    author,
    githubUrl: 'https://github.com/preetDev004/Fragments',
    version,
  });
});

// Define a route to cause a server error - TESTING PURPOSES ONLY
app.get('/cause-server-error', () => {
  throw new Error('Intentional server error');
});

// Add 404 middleware to handle any requests for resources that can't be found
app.use((req, res) => {
  res.status(404).json(createErrorResponse(404, 'not found'));
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: AppError, req: Request, res: Response, next: NextFunction) => {
  // We may already have an error response we can use, but if not,
  // use a generic `500` server error and message.
  const status = err.status || 500;
  const message = err.message || 'unable to process request';

  // If this is a server error, log something so we can see what's going on.
  if (status > 499) {
    logger.error({ err }, `Error processing request`);
  }

  res.status(status).json(createErrorResponse(status, message));
});

export default app;
