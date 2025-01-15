//!NOTE: This is a workaround to allow for dynamic module loading in a Node.js environment. 
//!      It's not recommended for production.

/* eslint-disable @typescript-eslint/no-require-imports */
import AuthModule from '../../types/authModule';

// Make sure our env isn't configured for both AWS Cognito and HTTP Basic Auth
if (
  process.env.AWS_COGNITO_POOL_ID &&
  process.env.AWS_COGNITO_CLIENT_ID &&
  process.env.HTPASSWD_FILE
) {
  throw new Error(
    'env contains configuration for both AWS Cognito and HTTP Basic Auth. Only one is allowed.'
  );
}

let authModule: AuthModule;

if (process.env.AWS_COGNITO_POOL_ID && process.env.AWS_COGNITO_CLIENT_ID) {
  authModule = require('./cognito');
} else if (process.env.HTPASSWD_FILE && process.env.NODE_ENV !== 'production') {
  authModule = require('./basic-auth');
} else {
  throw new Error('missing env vars: no authorization configuration found');
}

export default authModule;
