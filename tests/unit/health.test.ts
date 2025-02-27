import request from 'supertest';
import { author, version } from '../../package.json';
import app from '../../src/app';

describe('/ health check', () => {
  test('should return HTTP 200 response', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toBe(200);
  });

  test('should return Cache-Control: no-cache header', async () => {
    const res = await request(app).get('/');
    expect(res.headers['cache-control']).toEqual('no-cache');
  });

  test('should return status: ok in response', async () => {
    const res = await request(app).get('/');
    expect(res.body.status).toEqual('ok');
  });

  test('should return correct version, githubUrl, and author in response', async () => {
    const res = await request(app).get('/');
    expect(res.body.author).toEqual(author);
    expect(res.body.githubUrl.startsWith('https://github.com/')).toBe(true);
    expect(res.body.version).toEqual(version);
  });
});

/* eslint-disable @typescript-eslint/no-require-imports */

describe('Basic Auth Implementation', () => {
  const originalEnv = { ...process.env };
  let mockStrategy: jest.Mock;
  let mockBasicAuth: jest.Mock;
  let mockAuthPassport: jest.Mock;

  beforeEach(() => {
    jest.resetModules();
    process.env.HTPASSWD_FILE = './test.htpasswd';

    // Mock logger
    jest.mock('../../src/logger', () => ({
      info: jest.fn(),
      error: jest.fn(),
    }));

    // Mock Passport Strategy
    mockStrategy = jest.fn();
    jest.mock('passport', () => ({
      Strategy: mockStrategy,
    }));

    // Mock http-auth
    mockBasicAuth = jest.fn().mockReturnValue({});
    jest.mock('http-auth', () => ({
      basic: mockBasicAuth,
    }));

    // Mock http-auth-passport
    mockAuthPassport = jest.fn().mockReturnValue('mock-strategy');
    jest.mock('http-auth-passport', () => mockAuthPassport);
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  test('throws error when HTPASSWD_FILE is not defined', () => {
    delete process.env.HTPASSWD_FILE;
    expect(() => require('../../src/auth/basic-auth')).toThrow();
  });

  test('logs initialization message', () => {
    const logger = require('../../src/logger');
    require('../../src/auth/basic-auth');
    expect(logger.info).toHaveBeenCalledWith('Using HTTP Basic Auth for auth');
  });

  describe('strategy()', () => {
    test('creates basic auth strategy with correct configuration', () => {
      const { strategy } = require('../../src/auth/basic-auth');

      const result = strategy();

      expect(mockBasicAuth).toHaveBeenCalledWith({
        file: './test.htpasswd',
      });
      expect(mockAuthPassport).toHaveBeenCalledWith({});
      expect(result).toBe('mock-strategy');
    });
  });

  describe('authenticate()', () => {
    test('returns authorization middleware with http strategy', () => {
      // Mock authorize middleware
      const mockAuthorize = jest.fn().mockReturnValue('auth-middleware');
      jest.mock('../../src/auth/auth-middleware', () => mockAuthorize);

      const { authenticate } = require('../../src/auth/basic-auth');
      const result = authenticate();

      expect(mockAuthorize).toHaveBeenCalledWith('http');
      expect(result).toBe('auth-middleware');
    });
  });
});
