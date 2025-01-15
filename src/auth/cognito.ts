import passport from 'passport';
import { Strategy as BearerStrategy } from 'passport-http-bearer';
import { CognitoJwtVerifier } from 'aws-jwt-verify';
import logger from '../logger';
import { Strategy } from 'passport';
import { RequestHandler } from 'express';

// We expect AWS_COGNITO_POOL_ID and AWS_COGNITO_CLIENT_ID to be defined.
if (!(process.env.AWS_COGNITO_POOL_ID && process.env.AWS_COGNITO_CLIENT_ID)) {
  throw new Error('missing expected env vars: AWS_COGNITO_POOL_ID and AWS_COGNITO_CLIENT_ID');
}

// Create a Cognito JWT Verifier, which confirms that any JWT we get from a user is valid and trusted.
// See: https://github.com/awslabs/aws-jwt-verify#cognitojwtverifier-verify-parameters
const jwtVerifier = CognitoJwtVerifier.create({
  userPoolId: process.env.AWS_COGNITO_POOL_ID as string,
  clientId: process.env.AWS_COGNITO_CLIENT_ID as string,
  tokenUse: 'id', // We expect an Identity Token (vs. Access Token)
});

// Log the configuration details
logger.info('Configured to use AWS Cognito for Authorization');

// At startup, download and cache the public keys (JWKS) needed to verify Cognito JWTs.
// See: https://auth0.com/docs/secure/tokens/json-web-tokens/json-web-key-sets
jwtVerifier
  .hydrate()
  .then(() => {
    logger.info('Cognito JWKS successfully cached');
  })
  .catch((err: Error) => {
    logger.error({ err }, 'Unable to cache Cognito JWKS');
  });

/**
 * Passport strategy for verifying Bearer Tokens using the Cognito JWT Verifier.
 */
export const strategy = (): Strategy =>
  new BearerStrategy(async (token, done) => {
    try {
      // Log the token for debugging
      logger.debug({ token }, 'Attempting to verify token');

      // Verify the JWT
      const user = await jwtVerifier.verify(token);
      logger.debug({ user }, 'verified user token');

      // Pass the user's email to the next middleware or handler
      done(null, user.email);
    } catch (err) {
      // Log more details about the verification failure
      logger.error({ err, token }, 'Token verification failed');
      done(null, false);
    }
  });

/**
 * Middleware to authenticate requests using Passport and the configured Bearer strategy.
 */
export const authenticate = (): RequestHandler =>
  passport.authenticate('bearer', { session: false });
