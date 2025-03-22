import request from 'supertest';
import app from '../../src/app';
import Fragment from '../../src/model/fragment';

describe('GET /v1/fragments/:id/info', () => {
  // If the request is missing the Authorization header, it should be forbidden
  test('unauthenticated requests are denied', () =>
    request(app).get('/v1/fragments/123/info').expect(401));

  // If the wrong username/password pair are used (no such user), it should be forbidden
  test('incorrect credentials are denied', () =>
    request(app)
      .get('/v1/fragments/123/info')
      .auth('invalid@email.com', 'incorrect_password')
      .expect(401));

  test('authenticated users get fragment metadata', async () => {
    // First create a fragment
    const postResponse = await request(app)
      .post('/v1/fragments')
      .set('Content-Type', 'text/plain')
      .send('test fragment content')
      .auth('user1@email.com', 'password1');

    const fragmentId = postResponse.body.fragment.id;

    // Get the fragment info
    const res = await request(app)
      .get(`/v1/fragments/${fragmentId}/info`)
      .auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.fragment).toHaveProperty('id');
    expect(res.body.fragment).toHaveProperty('ownerId');
    expect(res.body.fragment).toHaveProperty('type', 'text/plain');
    expect(res.body.fragment).toHaveProperty('size', 'test fragment content'.length);
    expect(res.body.fragment).toHaveProperty('created');
    expect(res.body.fragment).toHaveProperty('updated');
  });

  test('returns 404 for non-existent fragment', async () => {
    const res = await request(app)
      .get('/v1/fragments/non-existent-id/info')
      .auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(404);
    expect(res.body.status).toBe('error');
    expect(res.body.error.message).toBeTruthy();
  });

  test('users cannot access other users fragments', async () => {
    // First create a fragment with user1
    const postResponse = await request(app)
      .post('/v1/fragments')
      .set('Content-Type', 'text/plain')
      .send('test fragment content')
      .auth('user1@email.com', 'password1');

    const fragmentId = postResponse.body.fragment.id;

    // Try to access with user2
    const res = await request(app)
      .get(`/v1/fragments/${fragmentId}/info`)
      .auth('user2@email.com', 'password2');

    expect(res.statusCode).toBe(404);
    expect(res.body.status).toBe('error');
  });
  test('handles non-Error type exceptions', async () => {
    // Mock Fragment.prototype.save to throw a non-Error type
    jest.spyOn(Fragment, 'byId').mockImplementationOnce(() => {
      throw 'Unknown error'; // throwing a string instead of Error
    });

    const res = await request(app)
      .get('/v1/fragments/invalid/info')
      .auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(500);
    expect(res.body.error.message).toBe('Did not find fragment!');
  });
});
