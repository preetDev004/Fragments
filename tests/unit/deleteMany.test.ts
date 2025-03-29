import request from 'supertest';
import app from '../../src/app';
import Fragment from '../../src/model/fragment';

describe('DELETE /v1/fragments (delete many)', () => {
  // Unauthenticated requests should be denied
  test('unauthenticated requests are denied', async () => {
    const res = await request(app).delete('/v1/fragments?ids=1234');
    expect(res.statusCode).toBe(401);
  });

  // Requests with incorrect credentials should be denied
  test('incorrect credentials are denied', async () => {
    const res = await request(app)
      .delete('/v1/fragments?ids=1234')
      .auth('invalid@email.com', 'incorrect_password');
    expect(res.statusCode).toBe(401);
  });
  
  test('No fragment ids provided', async () => {
    const res = await request(app)
      .delete('/v1/fragments?ids=')
      .auth('user1@email.com', 'password1');
    expect(res.statusCode).toBe(400);
  });
  
  test('Access Denied to other user fragment deletion', async () => {
    const postRes = await request(app)
    .post('/v1/fragments')
    .set('Content-Type', 'text/plain')
    .send('testing data')
    .auth('user1@email.com', 'password1');

    const res = await request(app)
      .delete(`/v1/fragments?ids=${postRes.body.fragment.id}`)
      .auth('user2@email.com', 'password2');
    expect(res.statusCode).toBe(404);
  });

  // Authenticated users can delete multiple fragments
  test('authenticated users can delete multiple fragments', async () => {
    const userEmail = 'user1@email.com';
    const userPassword = 'password1';

    // Create two fragments
    const postRes1 = await request(app)
      .post('/v1/fragments')
      .set('Content-Type', 'text/plain')
      .send('First fragment to delete')
      .auth(userEmail, userPassword);
    expect(postRes1.statusCode).toBe(201);
    const fragmentId1 = postRes1.body.fragment.id;

    const postRes2 = await request(app)
      .post('/v1/fragments')
      .set('Content-Type', 'text/plain')
      .send('Second fragment to delete')
      .auth(userEmail, userPassword);
    expect(postRes2.statusCode).toBe(201);
    const fragmentId2 = postRes2.body.fragment.id;

    // Delete both fragments at once using query parameters
    const deleteRes = await request(app)
      .delete(`/v1/fragments?ids=${fragmentId1}&ids=${fragmentId2}`)
      .auth(userEmail, userPassword);
    expect(deleteRes.statusCode).toBe(200);
    expect(deleteRes.body.status).toBe('ok');

    // Verify each fragment is deleted (should return 404)
    const getRes1 = await request(app)
      .get(`/v1/fragments/${fragmentId1}`)
      .auth(userEmail, userPassword);
    expect(getRes1.statusCode).toBe(404);

    const getRes2 = await request(app)
      .get(`/v1/fragments/${fragmentId2}`)
      .auth(userEmail, userPassword);
    expect(getRes2.statusCode).toBe(404);
  });

  // Users should not be allowed to delete fragments that do not belong to them
  test("users cannot delete fragments belonging to other users", async () => {
    // Create a fragment as user1
    const postRes = await request(app)
      .post('/v1/fragments')
      .set('Content-Type', 'text/plain')
      .send('User1 fragment for access control test')
      .auth('user1@email.com', 'password1');
    expect(postRes.statusCode).toBe(201);
    const fragmentId = postRes.body.fragment.id;

    // Attempt deletion as user2
    const deleteRes = await request(app)
      .delete(`/v1/fragments?ids=${fragmentId}`)
      .auth('user2@email.com', 'password2');
    // Depending on your implementation this might be a 404 or 403.
    // Here we assume 404 if the fragment isn't found for that user.
    expect(deleteRes.statusCode).toBe(404);
  });

  // Deleting non-existent fragments should return a 404 (or your chosen error code)
  test('deleting non-existent fragment returns 404', async () => {
    const res = await request(app)
      .delete('/v1/fragments?ids=non-existent-id')
      .auth('user1@email.com', 'password1');
    expect(res.statusCode).toBe(404);
  });

  // Test error during the deletion process
  test('handles errors during deletion process', async () => {
    // First create a fragment to later trigger an error during deletion
    const postRes = await request(app)
      .post('/v1/fragments')
      .set('Content-Type', 'text/plain')
      .send('Test fragment for deletion error')
      .auth('user1@email.com', 'password1');
    expect(postRes.statusCode).toBe(201);
    const fragmentId = postRes.body.fragment.id;

    // Mock Fragment.deleteMany to throw an Error
    jest.spyOn(Fragment, 'deleteMany').mockImplementationOnce(() => {
      throw new Error('Failed to delete fragments');
    });

    const res = await request(app)
      .delete(`/v1/fragments?ids=${fragmentId}`)
      .auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(500);
    expect(res.body.error.message).toBe('Failed to delete fragments');
  });
});
