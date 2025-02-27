import request from 'supertest';
import app from '../../src/app';

describe('GET /v1/fragments', () => {
  // If the request is missing the Authorization header, it should be forbidden
  test('unauthenticated requests are denied', () => request(app).get('/v1/fragments').expect(401));

  // If the wrong username/password pair are used (no such user), it should be forbidden
  test('incorrect credentials are denied', () =>
    request(app).get('/v1/fragments').auth('invalid@email.com', 'incorrect_password').expect(401));

  test('authenticated users get a no content', async () => {
    const res = await request(app).get('/v1/fragments').auth('user1@email.com', 'password1');
    expect(res.statusCode).toBe(204);
  });

  test('authenticated users get a fragments array of IDs', async () => {
    const content = 'testing metadata';

    await request(app)
      .post('/v1/fragments')
      .set('Content-Type', 'text/plain')
      .send(content)
      .auth('user1@email.com', 'password1');

    const res = await request(app).get('/v1/fragments').auth('user1@email.com', 'password1');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(typeof res.body.fragments[0] === 'string').toBe(true);
  });

  test('authenticated users get expanded fragments with metadata when expand=1', async () => {
    // First create a fragment
    await request(app)
      .post('/v1/fragments')
      .set('Content-Type', 'text/plain')
      .send('testing expanded')
      .auth('user1@email.com', 'password1');

    // Get fragments with expand=1
    const res = await request(app)
      .get('/v1/fragments?expand=1')
      .auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(Array.isArray(res.body.fragments)).toBe(true);

    // Check that we got a full fragment object and not just an ID
    const fragment = res.body.fragments[0];
    expect(typeof fragment).toBe('object');
    expect(fragment).toHaveProperty('id');
    expect(fragment).toHaveProperty('ownerId');
    expect(fragment).toHaveProperty('type', 'text/plain');
    expect(fragment).toHaveProperty('size', 'testing expanded'.length);
    expect(fragment).toHaveProperty('created');
    expect(fragment).toHaveProperty('updated');
  });
});
