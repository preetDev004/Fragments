import request from 'supertest';
import app from '../../src/app';
import Fragment from '../../src/model/fragment';
import MarkdownIt from 'markdown-it';

describe('GET /v1/fragments/:id.:ext', () => {
  // If the request is missing the Authorization header, it should be forbidden
  test('unauthenticated requests are denied', () =>
    request(app).get('/v1/fragments/1234.html').expect(401));

  // If the wrong username/password pair are used (no such user), it should be forbidden
  test('incorrect credentials are denied', () =>
    request(app)
      .get('/v1/fragments/1234.html')
      .auth('invalid@email.com', 'incorrect_password')
      .expect(401));

  // Using invalid fragment id should return 404
  test('invalid fragment id returns 404', async () => {
    const res = await request(app)
      .get('/v1/fragments/invalid_id.html')
      .auth('user1@email.com', 'password1');
    expect(res.statusCode).toBe(404);
  });

  // Test successful markdown to HTML conversion
  test('converts markdown fragment to HTML when requested', async () => {
    // First create a markdown fragment
    const userEmail = 'user1@email.com';
    const userPassword = 'password1';
    const markdownContent = '# Hello World\n\nThis is a test.';
    const expectedHtml = '<h1>Hello World</h1>\n<p>This is a test.</p>\n';

    // Create a markdown fragment
    const postRes = await request(app)
      .post('/v1/fragments')
      .set('Content-Type', 'text/markdown')
      .send(markdownContent)
      .auth(userEmail, userPassword);

    expect(postRes.statusCode).toBe(201);
    const fragmentId = postRes.body.fragment.id;

    // Request the fragment as HTML
    const getRes = await request(app)
      .get(`/v1/fragments/${fragmentId}.html`)
      .auth(userEmail, userPassword);

    expect(getRes.statusCode).toBe(200);
    expect(getRes.headers['content-type']).toMatch(/^text\/html/);
    expect(getRes.text).toEqual(expectedHtml);
  });

  // Test for unsupported conversion request
  test('returns 400 for unsupported conversion', async () => {
    // Create a text/plain fragment
    const userEmail = 'user1@email.com';
    const userPassword = 'password1';

    const postRes = await request(app)
      .post('/v1/fragments')
      .set('Content-Type', 'text/plain')
      .send('This is plain text')
      .auth(userEmail, userPassword);

    expect(postRes.statusCode).toBe(201);
    const fragmentId = postRes.body.fragment.id;

    // Try to request it as HTML
    const getRes = await request(app)
      .get(`/v1/fragments/${fragmentId}.html`)
      .auth(userEmail, userPassword);

    expect(getRes.statusCode).toBe(400);
    expect(getRes.body.error.message).toMatch(
      /Conversion not possible for text\/plain fragment to html/
    );
  });

  // Test that users can't access other users' fragments
  test('users cannot access other users converted fragments', async () => {
    // First create a fragment as user1
    const markdownContent = '# Private Content';
    const postRes = await request(app)
      .post('/v1/fragments')
      .set('Content-Type', 'text/markdown')
      .send(markdownContent)
      .auth('user1@email.com', 'password1');

    const fragmentId = postRes.body.fragment.id;

    // Try to access the converted fragment as user2
    const getRes = await request(app)
      .get(`/v1/fragments/${fragmentId}.html`)
      .auth('user2@email.com', 'password2');

    expect(getRes.statusCode).toBe(404);
  });

  // Test handling of exceptions in the converter
  test('handles markdown-it render errors', async () => {
    // Create a markdown fragment
    const userEmail = 'user1@email.com';
    const userPassword = 'password1';
    const markdownContent = '# Test';

    const postRes = await request(app)
      .post('/v1/fragments')
      .set('Content-Type', 'text/markdown')
      .send(markdownContent)
      .auth(userEmail, userPassword);

    const fragmentId = postRes.body.fragment.id;

    // Mock MarkdownIt's render method to throw an error
    jest.spyOn(MarkdownIt.prototype, 'render').mockImplementationOnce(() => {
      throw new Error('Markdown rendering failed');
    });

    // Request the fragment as HTML
    const getRes = await request(app)
      .get(`/v1/fragments/${fragmentId}.html`)
      .auth(userEmail, userPassword);

    expect(getRes.statusCode).toBe(500);
    expect(getRes.body.error.message).toBe('Markdown rendering failed');
  });

  // Test for non-Error type exceptions
  test('handles non-Error type exceptions during conversion', async () => {
    // Mock Fragment.byId to throw a non-Error type
    jest.spyOn(Fragment, 'byId').mockImplementationOnce(() => {
      throw 'Unknown error'; // throwing a string instead of Error
    });

    const res = await request(app)
      .get('/v1/fragments/some-id.html')
      .auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(500);
    expect(res.body.error.message).toBe('Conversion Failed!');
  });
});
