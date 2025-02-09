import { jest } from '@jest/globals';
import request from 'supertest';
import app from '../../src/app';

describe('/ middleware tests', () => {
  test('should apply security headers from helmet', async () => {
    const res = await request(app).get('/');
    expect(res.headers['x-dns-prefetch-control']).toBe('off');
    expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
    expect(res.headers['x-xss-protection']).toBe('0'); // Default setting
  });

  test('should allow cross-origin requests with CORS', async () => {
    const res = await request(app).get('/');
    expect(res.headers['access-control-allow-origin']).toBe('*');
  });

  test('should compress responses with gzip', async () => {
    const res = await request(app).get('/').set('Accept-Encoding', 'gzip');
    expect(res.headers['content-encoding']).toBe('gzip');
  });
});

/* eslint-disable @typescript-eslint/no-require-imports */
describe('Auth Module Selection', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  test('throws error when no auth configuration is provided', () => {
    delete process.env.AWS_COGNITO_POOL_ID;
    delete process.env.AWS_COGNITO_CLIENT_ID;
    delete process.env.HTPASSWD_FILE;

    expect(() => require('../../src/auth')).toThrow(
      'missing env vars: no authorization configuration found'
    );
  });

  test('throws error when both Cognito and Basic Auth are configured', () => {
    process.env.AWS_COGNITO_POOL_ID = 'test-pool';
    process.env.AWS_COGNITO_CLIENT_ID = 'test-client';
    process.env.HTPASSWD_FILE = './test.htpasswd';

    expect(() => require('../../src/auth')).toThrow(
      'env contains configuration for both AWS Cognito and HTTP Basic Auth. Only one is allowed.'
    );
  });

  test('selects Basic Auth when HTPASSWD_FILE is configured', () => {
    process.env.HTPASSWD_FILE = './test.htpasswd';
    process.env.NODE_ENV = 'development';

    const auth = require('../../src/auth').default;
    expect(auth).toBeDefined();
    expect(auth.strategy).toBeDefined();
    expect(auth.authenticate).toBeDefined();
  });
});
