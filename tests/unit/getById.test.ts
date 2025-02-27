import request from 'supertest';
import app from '../../src/app';
import Fragment from '../../src/model/fragment';

describe('GET /v1/fragments/:id', () => {
  // If the request is missing the Authorization header, it should be forbidden
  test('unauthenticated requests are denied', () =>
    request(app).get('/v1/fragments/1234').expect(401));

  // If the wrong username/password pair are used (no such user), it should be forbidden
  test('incorrect credentials are denied', () =>
    request(app)
      .get('/v1/fragments/1234')
      .auth('invalid@email.com', 'incorrect_password')
      .expect(401));

  // Using invalid fragment id should return 404
  test('invalid fragment id returns 404', async () => {
    const res = await request(app)
      .get('/v1/fragments/invalid_id')
      .auth('user1@email.com', 'password1');
    expect(res.statusCode).toBe(404);
  });

  // Test successful fragment retrieval
  test('authenticated users can get their fragments by id', async () => {
    // First create a fragment
    const userEmail = 'user1@email.com';
    const userPassword = 'password1';

    // Create a fragment
    const postRes = await request(app)
      .post('/v1/fragments')
      .set('Content-Type', 'text/plain')
      .send('Testing the endpoint')
      .auth(userEmail, userPassword);

    expect(postRes.statusCode).toBe(201);
    const fragmentId = postRes.body.fragments[0].id;

    // Retrieve the fragment using the same user
    const getRes = await request(app)
      .get(`/v1/fragments/${fragmentId}`)
      .set('Accept-Encoding', 'identity')
      .auth(userEmail, userPassword);

    expect(getRes.statusCode).toBe(200);
    expect(getRes.headers['content-type']).toBe('text/plain');
    expect(parseInt(getRes.headers['content-length'])).toBe('Testing the endpoint'.length);
    expect(getRes.text).toEqual('Testing the endpoint');
  });

  // Test that users can't access other users' fragments
  test('users cannot access fragments belonging to other users', async () => {
    // First create a fragment as user1
    const content = 'testing fragment access control';
    const postRes = await request(app)
      .post('/v1/fragments')
      .set('Content-Type', 'text/plain')
      .send(content)
      .auth('user1@email.com', 'password1');

    const fragmentId = postRes.body.fragments[0].id;

    // Try to access the fragment as user2
    const getRes = await request(app)
      .get(`/v1/fragments/${fragmentId}`)
      .auth('user2@email.com', 'password2');

    expect(getRes.statusCode).toBe(404);
  });
  // Test non-Error type exceptions
  test('handles non-Error type exceptions', async () => {
    // Mock Fragment.prototype.save to throw a non-Error type
    jest.spyOn(Fragment, 'byId').mockImplementationOnce(() => {
      throw 'Unknown error'; // throwing a string instead of Error
    });

    const res = await request(app)
      .get('/v1/fragments/invalid')
      .auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(500);
    expect(res.body.error.message).toBe('Did not find fragment!');
  });
});
