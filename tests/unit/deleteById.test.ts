import request from 'supertest';
import app from '../../src/app';
import Fragment from '../../src/model/fragment';

describe('DELETE /v1/fragments/:id', () => {
  // If the request is missing the Authorization header, it should be forbidden
  test('unauthenticated requests are denied', () =>
    request(app).delete('/v1/fragments/1234').expect(401));

  // If the wrong username/password pair are used (no such user), it should be forbidden
  test('incorrect credentials are denied', () =>
    request(app)
      .delete('/v1/fragments/1234')
      .auth('invalid@email.com', 'incorrect_password')
      .expect(401));

  // Test successful fragment deletion
  test('authenticated users can delete their fragments', async () => {
    // First create a fragment
    const userEmail = 'user1@email.com';
    const userPassword = 'password1';

    // Create a fragment
    const postRes = await request(app)
      .post('/v1/fragments')
      .set('Content-Type', 'text/plain')
      .send('Test fragment to delete')
      .auth(userEmail, userPassword);

    expect(postRes.statusCode).toBe(201);
    const fragmentId = postRes.body.fragment.id;

    // Delete the fragment
    const deleteRes = await request(app)
      .delete(`/v1/fragments/${fragmentId}`)
      .auth(userEmail, userPassword);

    expect(deleteRes.statusCode).toBe(200);
    expect(deleteRes.body.status).toBe('ok');

    // Verify the fragment is deleted by trying to get it
    const getRes = await request(app)
      .get(`/v1/fragments/${fragmentId}`)
      .auth(userEmail, userPassword);

    expect(getRes.statusCode).toBe(404);
  });

  // Test that users can't delete other users' fragments
  test('users cannot delete fragments belonging to other users', async () => {
    // First create a fragment as user1
    const content = 'testing fragment deletion access control';
    const postRes = await request(app)
      .post('/v1/fragments')
      .set('Content-Type', 'text/plain')
      .send(content)
      .auth('user1@email.com', 'password1');

    const fragmentId = postRes.body.fragment.id;

    // Try to delete the fragment as user2
    const deleteRes = await request(app)
      .delete(`/v1/fragments/${fragmentId}`)
      .auth('user2@email.com', 'password2');

    expect(deleteRes.statusCode).toBe(404);
  });

  // Test deleting a non-existent fragment
  test('deleting non-existent fragment returns 404', async () => {
    const res = await request(app)
      .delete('/v1/fragments/non-existent-id')
      .auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(404);
  });

  // Test handling of non-Error type exceptions
  test('handles non-Error type exceptions', async () => {
    // Mock Fragment.byId to throw a non-Error type
    jest.spyOn(Fragment, 'byId').mockImplementationOnce(() => {
      throw 'Unknown error'; // throwing a string instead of Error
    });

    const res = await request(app)
      .delete('/v1/fragments/invalid')
      .auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(500);
    expect(res.body.error.message).toBe('Did delete fragment!');
  });

  // Test error during deletion process
  test('handles errors during deletion process', async () => {
    // First create a fragment
    const postRes = await request(app)
      .post('/v1/fragments')
      .set('Content-Type', 'text/plain')
      .send('Test fragment')
      .auth('user1@email.com', 'password1');

    const fragmentId = postRes.body.fragment.id;

    // Mock Fragment.delete to throw an error
    jest.spyOn(Fragment, 'delete').mockImplementationOnce(() => {
      throw new Error('Failed to delete fragment');
    });

    const res = await request(app)
      .delete(`/v1/fragments/${fragmentId}`)
      .auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(500);
    expect(res.body.error.message).toBe('Failed to delete fragment');
  });
});
