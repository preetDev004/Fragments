import app from '../../src/app';
import request from 'supertest';

describe('/404 route tests', () => {
  test('should return correct error structure for 404 errors', async () => {
    const res = await request(app).get('/invalid-route');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      status: 'error',
      error: {
        message: 'not found',
        code: 404,
      },
    });
  });

  test('should return Content-Type: application/json for 404 errors', async () => {
    const res = await request(app).get('/invalid-route');
    expect(res.headers['content-type']).toMatch(/application\/json/);
  });
});



