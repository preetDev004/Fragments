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
    expect(typeof(res.body.fragments[0])==='string').toBe(true);
  });
  
});


describe('GET /v1/fragments/:id', () => {
  // If the request is missing the Authorization header, it should be forbidden
  test('unauthenticated requests are denied', () => 
    request(app).get('/v1/fragments/1234').expect(401)
  );

  // If the wrong username/password pair are used (no such user), it should be forbidden
  test('incorrect credentials are denied', () =>
    request(app)
      .get('/v1/fragments/1234')
      .auth('invalid@email.com', 'incorrect_password')
      .expect(401)
  );

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
    const content = 'testing fragment retrieval';
    const postRes = await request(app)
      .post('/v1/fragments')
      .set('Content-Type', 'text/plain')
      .send(content)
      .auth('user1@email.com', 'password1');
    
    expect(postRes.statusCode).toBe(201);
    const fragmentId = postRes.body.fragments[0].id;

    // Now try to get this fragment by ID
    const getRes = await request(app)
      .get(`/v1/fragments/${fragmentId}`)
      .auth('user1@email.com', 'password1');

    expect(getRes.statusCode).toBe(200);
    expect(getRes.body.status).toBe('ok');
    
    const fragment = getRes.body.fragment;
    expect(fragment).toHaveProperty('id', fragmentId);
    expect(fragment).toHaveProperty('ownerId');
    expect(fragment).toHaveProperty('type', 'text/plain');
    expect(fragment).toHaveProperty('size', content.length);
    expect(fragment).toHaveProperty('created');
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
});
