import request from 'supertest';
import app from '../../src/app';
import { putUserFragmentHandler } from '../../src/routes/api/putById';
import { Request, Response } from 'express';
import Fragment from '../../src/model/fragment';

describe('PUT /v1/fragments/:id', () => {
  // If the request is missing the Authorization header, it should be forbidden
  test('unauthenticated requests are denied', () =>
    request(app).put('/v1/fragments/1234').expect(401));

  // If the wrong username/password pair are used (no such user), it should be forbidden
  test('incorrect credentials are denied', () =>
    request(app)
      .put('/v1/fragments/1234')
      .auth('invalid@email.com', 'incorrect_password')
      .expect(401));

  // Test successful fragment update
  test('authenticated users can update their fragments', async () => {
    const userEmail = 'user1@email.com';
    const userPassword = 'password1';

    // First create a fragment
    const postRes = await request(app)
      .post('/v1/fragments')
      .set('Content-Type', 'text/plain')
      .send('Original content')
      .auth(userEmail, userPassword);

    expect(postRes.statusCode).toBe(201);
    const fragmentId = postRes.body.fragment.id;

    // Update the fragment
    const updateRes = await request(app)
      .put(`/v1/fragments/${fragmentId}`)
      .set('Content-Type', 'text/plain')
      .send('Updated content')
      .auth(userEmail, userPassword);

    expect(updateRes.statusCode).toBe(200);
    expect(updateRes.body.status).toBe('ok');
    expect(updateRes.body.fragment.size).toBe('Updated content'.length);

    // Verify the updated content
    const getRes = await request(app)
      .get(`/v1/fragments/${fragmentId}`)
      .auth(userEmail, userPassword);

    expect(getRes.statusCode).toBe(200);
    expect(getRes.text).toEqual('Updated content');
  });

  test('users cannot update fragments belonging to other users', async () => {
    // Create a fragment as user1
    const postRes = await request(app)
      .post('/v1/fragments')
      .set('Content-Type', 'text/plain')
      .send('User1 fragment')
      .auth('user1@email.com', 'password1');

    const fragmentId = postRes.body.fragment.id;

    // Try to update as user2
    const updateRes = await request(app)
      .put(`/v1/fragments/${fragmentId}`)
      .set('Content-Type', 'text/plain')
      .send('User2 trying to update')
      .auth('user2@email.com', 'password2');

    expect(updateRes.statusCode).toBe(404);
  });

  test('cannot update with different content type', async () => {
    // Create a text fragment
    const postRes = await request(app)
      .post('/v1/fragments')
      .set('Content-Type', 'text/plain')
      .send('Original content')
      .auth('user1@email.com', 'password1');

    const fragmentId = postRes.body.fragment.id;

    // Try to update with JSON
    const updateRes = await request(app)
      .put(`/v1/fragments/${fragmentId}`)
      .set('Content-Type', 'application/json')
      .send('{"key": "value"}')
      .auth('user1@email.com', 'password1');

    expect(updateRes.statusCode).toBe(400);
    expect(updateRes.body.error.message).toContain(
      'Cannot update fragment with different MIME type'
    );
  });

  test('updating non-existent fragment returns 404', async () => {
    const res = await request(app)
      .put('/v1/fragments/non-existent-id')
      .set('Content-Type', 'text/plain')
      .send('Updated content')
      .auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(404);
  });

  test('rejects invalid content for the given content type', async () => {
    // Create a fragment with JSON type
    const postRes = await request(app)
      .post('/v1/fragments')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({ valid: 'json' }))
      .auth('user1@email.com', 'password1');

    const fragmentId = postRes.body.fragment.id;

    // Try to update with invalid JSON content
    const updateRes = await request(app)
      .put(`/v1/fragments/${fragmentId}`)
      .set('Content-Type', 'application/json')
      .send('This is not valid JSON')
      .auth('user1@email.com', 'password1');

    expect(updateRes.statusCode).toBe(400);
    expect(updateRes.body.error.message).toBe('Invalid JSON format');
  });

  test('rejects non-Buffer request bodies', async () => {
    // Import necessary types

    // Create mock request with non-Buffer body
    const req = {
      params: { id: 'test-id' },
      user: 'user1@email.com',
      body: 'This is a string, not a Buffer', // Non-Buffer body
      headers: { 'content-type': 'text/plain' },
    } as unknown as Request; // Use type assertion to tell TypeScript this is a Request

    // Create mock response object with Jest spies
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      header: jest.fn(),
    } as unknown as Response;

    // Call the handler directly
    await putUserFragmentHandler(req, res);

    // Verify correct error response
    expect(res.status).toHaveBeenCalledWith(415);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'error',
        error: expect.objectContaining({
          code: 415,
          message: 'Unsupported content type',
        }),
      })
    );
  });

  test('handles regular Error during fragment update', async () => {
    // First create a fragment
    const postRes = await request(app)
      .post('/v1/fragments')
      .set('Content-Type', 'text/plain')
      .send('Original content')
      .auth('user1@email.com', 'password1');

    const fragmentId = postRes.body.fragment.id;

    // Mock Fragment.byId to throw a regular Error
    jest.spyOn(Fragment, 'byId').mockImplementationOnce(() => {
      throw new Error('Database connection failed');
    });

    // Attempt to update
    const updateRes = await request(app)
      .put(`/v1/fragments/${fragmentId}`)
      .set('Content-Type', 'text/plain')
      .send('Updated content')
      .auth('user1@email.com', 'password1');

    expect(updateRes.statusCode).toBe(500);
    expect(updateRes.body.error.message).toBe('Database connection failed');
  });

  test('handles errors without message properties', async () => {
    // First create a fragment
    const postRes = await request(app)
      .post('/v1/fragments')
      .set('Content-Type', 'text/plain')
      .send('Original content')
      .auth('user1@email.com', 'password1');

    const fragmentId = postRes.body.fragment.id;

    // Mock Fragment.byId to throw an object that isn't an Error and has no message property
    jest.spyOn(Fragment, 'byId').mockImplementationOnce(() => {
      throw { code: 123 }; // An error-like object without a message property
    });

    // Attempt to update
    const updateRes = await request(app)
      .put(`/v1/fragments/${fragmentId}`)
      .set('Content-Type', 'text/plain')
      .send('Updated content')
      .auth('user1@email.com', 'password1');

    expect(updateRes.statusCode).toBe(500);
    expect(updateRes.body.error.message).toBe('Failed to update fragment');
  });
});
