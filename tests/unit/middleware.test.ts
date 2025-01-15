import app from '../../src/app';
import request from 'supertest';

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
