import request from 'supertest';
import app from '../../src/app';
import Fragment from '../../src/model/fragment';

describe('POST /v1/fragments', () => {
  // If the request is missing the Authorization header, it should be forbidden
  test('unauthenticated requests are denied', () => request(app).post('/v1/fragments').expect(401));

  // If the wrong username/password pair are used (no such user), it should be forbidden
  test('incorrect credentials are denied', () =>
    request(app).post('/v1/fragments').auth('invalid@email.com', 'incorrect_password').expect(401));

  test('authenticated users, with no content', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .set('Content-Type', 'application/json')
      .auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(400);
    expect(res.body.status).toBe('error');
  });

  // Using a valid username/password pair should give a success result with a .fragments array
  test('authenticated users get a newly created fragment', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .set('Content-Type', 'text/plain')
      .send('testing data')
      .auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe('ok');
    expect(res.headers['location']).toBe(
      `${process.env.API_URL}/v1/fragments/${res.body.fragment.id}`
    );
  });

  test('fragment metadata is correct', async () => {
    const content = 'testing metadata';

    const res = await request(app)
      .post('/v1/fragments')
      .set('Content-Type', 'text/plain')
      .send(content)
      .auth('user1@email.com', 'password1');

    const fragment = res.body.fragment;
    expect(fragment).toHaveProperty('id');
    expect(fragment).toHaveProperty('ownerId');
    expect(fragment).toHaveProperty('type', 'text/plain');
    expect(fragment).toHaveProperty('size', content.length);
    expect(fragment).toHaveProperty('created');
  });

  test('fragment size limit', async () => {
    const largeContent = 'x'.repeat(6 * 1024 * 1024); // 6MB

    const res = await request(app)
      .post('/v1/fragments')
      .set('Content-Type', 'text/plain')
      .send(largeContent)
      .auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(413); // Payload Too Large
  });

  // Note: The following test is conceptual and may require mocking
  // Test error during fragment saving (mocked scenario)
  // This would involve mocking Fragment.save() to throw an error
  test('handles fragment save error', async () => {
    // Mock Fragment.save() to throw an error
    jest.spyOn(Fragment.prototype, 'save').mockImplementationOnce(() => {
      throw new Error('Database error');
    });

    const res = await request(app)
      .post('/v1/fragments')
      .set('Content-Type', 'text/plain')
      .send('data')
      .auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(500);
    expect(res.body.error.message).toBe('Database error');
  });

  // Test fallback to request protocol and host
  test('uses request protocol and host when API_URL is not set', async () => {
    const originalApiUrl = process.env.API_URL;
    delete process.env.API_URL;

    const res = await request(app)
      .post('/v1/fragments')
      .set('Content-Type', 'text/plain')
      .send('test content')
      .auth('user1@email.com', 'password1');

    // supertest uses http://127.0.0.1:${port} by default
    expect(res.headers['location']).toMatch(
      /^http:\/\/127\.0\.0\.1:\d+\/v1\/fragments\/[A-Za-z0-9_-]+$/
    );

    // Restore original API_URL
    process.env.API_URL = originalApiUrl;
  });

  // Test error handling for setData failure
  test('handles setData error', async () => {
    // Mock Fragment.prototype.setData to throw an error
    jest.spyOn(Fragment.prototype, 'setData').mockImplementationOnce(() => {
      throw new Error('Failed to set data');
    });

    const res = await request(app)
      .post('/v1/fragments')
      .set('Content-Type', 'text/plain')
      .send('test content')
      .auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(500);
    expect(res.body.error.message).toBe('Failed to set data');
  });

  // Test non-Error type exceptions
  test('handles non-Error type exceptions', async () => {
    // Mock Fragment.prototype.save to throw a non-Error type
    jest.spyOn(Fragment.prototype, 'save').mockImplementationOnce(() => {
      throw 'Unknown error'; // throwing a string instead of Error
    });

    const res = await request(app)
      .post('/v1/fragments')
      .set('Content-Type', 'text/plain')
      .send('test content')
      .auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(500);
    expect(res.body.error.message).toBe('Unable to add the fragment');
  });

  // Test missing content-type header
  test('rejects requests without content-type header', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .send('test content')
      .auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(415);
  });
});
