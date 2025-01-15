// src/auth/basic-auth.ts
import auth from 'http-auth';
import passport from 'passport';
import authPassport from 'http-auth-passport';
import { Strategy } from 'passport';
import { RequestHandler } from 'express';
import logger from '../logger';

// We expect HTPASSWD_FILE to be defined.
if (!process.env.HTPASSWD_FILE) {
  throw new Error('missing expected env var: HTPASSWD_FILE');
}

// Log that we're using Basic Auth
logger.info('Using HTTP Basic Auth for auth');

export const strategy = (): Strategy =>
  // For our Passport authentication strategy, we'll look for a
  // username/password pair in the Authorization header.
  authPassport(
    auth.basic({
      file: process.env.HTPASSWD_FILE,
    })
  );

export const authenticate = (): RequestHandler => passport.authenticate('http', { session: false });
