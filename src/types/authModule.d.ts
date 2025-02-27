import { RequestHandler } from 'express';
import { Strategy } from 'passport-http-bearer';

interface AuthModule {
  strategy: () => Strategy;
  authenticate: () => RequestHandler;
}

export default AuthModule;
