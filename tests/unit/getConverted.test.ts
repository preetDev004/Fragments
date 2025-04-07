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

  // Test successful markdown to Plain Text conversion
  test('converts markdown fragment to Plain Text when requested', async () => {
    // Create a markdown fragment
    const userEmail = 'user1@email.com';
    const userPassword = 'password1';
    const markdownContent = '# Hello World\n\n**This** is a test.';

    const postRes = await request(app)
      .post('/v1/fragments')
      .set('Content-Type', 'text/markdown')
      .send(markdownContent)
      .auth(userEmail, userPassword);

    expect(postRes.statusCode).toBe(201);
    const fragmentId = postRes.body.fragment.id;

    // Request the fragment as Plain Text
    const getRes = await request(app)
      .get(`/v1/fragments/${fragmentId}.txt`)
      .auth(userEmail, userPassword);

    expect(getRes.statusCode).toBe(200);
    expect(getRes.headers['content-type']).toMatch(/^text\/plain/);
    // The markdown formatting should be stripped
    expect(getRes.text).not.toContain('#');
    expect(getRes.text).not.toContain('**');
    expect(getRes.text).toContain('Hello World');
    expect(getRes.text).toContain('This is a test');
  });

  // Test successful HTML to Plain Text conversion
  test('converts HTML fragment to Plain Text when requested', async () => {
    // Create an HTML fragment
    const userEmail = 'user1@email.com';
    const userPassword = 'password1';
    const htmlContent = '<h1>Hello World</h1><p>This is a <strong>test</strong>.</p>';

    const postRes = await request(app)
      .post('/v1/fragments')
      .set('Content-Type', 'text/html')
      .send(htmlContent)
      .auth(userEmail, userPassword);

    expect(postRes.statusCode).toBe(201);
    const fragmentId = postRes.body.fragment.id;

    // Request the fragment as Plain Text
    const getRes = await request(app)
      .get(`/v1/fragments/${fragmentId}.txt`)
      .auth(userEmail, userPassword);

    expect(getRes.statusCode).toBe(200);
    expect(getRes.headers['content-type']).toMatch(/^text\/plain/);
    // HTML tags should be removed
    expect(getRes.text).not.toContain('<h1>');
    expect(getRes.text).not.toContain('<strong>');
    expect(getRes.text).toContain('Hello World');
    expect(getRes.text).toContain('This is a test');
  });

  // Test successful CSV to Plain Text conversion
  test('converts CSV fragment to Plain Text when requested', async () => {
    // Create a CSV fragment
    const userEmail = 'user1@email.com';
    const userPassword = 'password1';
    const csvContent = 'name,age,city\nJohn,30,New York\nJane,25,Boston';

    const postRes = await request(app)
      .post('/v1/fragments')
      .set('Content-Type', 'text/csv')
      .send(csvContent)
      .auth(userEmail, userPassword);

    expect(postRes.statusCode).toBe(201);
    const fragmentId = postRes.body.fragment.id;

    // Request the fragment as Plain Text
    const getRes = await request(app)
      .get(`/v1/fragments/${fragmentId}.txt`)
      .auth(userEmail, userPassword);

    expect(getRes.statusCode).toBe(200);
    expect(getRes.headers['content-type']).toMatch(/^text\/plain/);
    // Should be the same as the original CSV (which is already text)
    expect(getRes.text).toBe(csvContent);
  });

  // Test successful CSV to JSON conversion
  test('converts CSV fragment to JSON when requested', async () => {
    // Create a CSV fragment
    const userEmail = 'user1@email.com';
    const userPassword = 'password1';
    const csvContent = 'name,age,city\nJohn,30,New York\nJane,25,Boston';

    const postRes = await request(app)
      .post('/v1/fragments')
      .set('Content-Type', 'text/csv')
      .send(csvContent)
      .auth(userEmail, userPassword);

    expect(postRes.statusCode).toBe(201);
    const fragmentId = postRes.body.fragment.id;

    // Request the fragment as JSON
    const getRes = await request(app)
      .get(`/v1/fragments/${fragmentId}.json`)
      .auth(userEmail, userPassword);

    expect(getRes.statusCode).toBe(200);
    expect(getRes.headers['content-type']).toMatch(/^application\/json/);

    // Parse the JSON response
    const jsonData = JSON.parse(getRes.text);

    // Check the structure and content
    expect(Array.isArray(jsonData)).toBe(true);
    expect(jsonData.length).toBe(2);
    expect(jsonData[0].name).toBe('John');
    expect(jsonData[0].age).toBe('30');
    expect(jsonData[0].city).toBe('New York');
    expect(jsonData[1].name).toBe('Jane');
    expect(jsonData[1].age).toBe('25');
    expect(jsonData[1].city).toBe('Boston');
  });

  // Test successful JSON to Plain Text conversion
  test('converts JSON fragment to Plain Text when requested', async () => {
    // Create a JSON fragment
    const userEmail = 'user1@email.com';
    const userPassword = 'password1';
    const jsonContent = JSON.stringify({ name: 'John', age: 30, city: 'New York' });

    const postRes = await request(app)
      .post('/v1/fragments')
      .set('Content-Type', 'application/json')
      .send(jsonContent)
      .auth(userEmail, userPassword);

    expect(postRes.statusCode).toBe(201);
    const fragmentId = postRes.body.fragment.id;

    // Request the fragment as Plain Text
    const getRes = await request(app)
      .get(`/v1/fragments/${fragmentId}.txt`)
      .auth(userEmail, userPassword);

    expect(getRes.statusCode).toBe(200);
    expect(getRes.headers['content-type']).toMatch(/^text\/plain/);
    // Should be a formatted version of the JSON
    expect(getRes.text).toContain('John');
    expect(getRes.text).toContain('30');
    expect(getRes.text).toContain('New York');
  });

  // Test successful JSON to YAML conversion
  test('converts JSON fragment to YAML when requested', async () => {
    // Create a JSON fragment
    const userEmail = 'user1@email.com';
    const userPassword = 'password1';
    const jsonContent = JSON.stringify({ name: 'John', age: 30, city: 'New York' });

    const postRes = await request(app)
      .post('/v1/fragments')
      .set('Content-Type', 'application/json')
      .send(jsonContent)
      .auth(userEmail, userPassword);

    expect(postRes.statusCode).toBe(201);
    const fragmentId = postRes.body.fragment.id;

    // Request the fragment as YAML
    const getRes = await request(app)
      .get(`/v1/fragments/${fragmentId}.yaml`)
      .auth(userEmail, userPassword);

    expect(getRes.statusCode).toBe(200);
    expect(getRes.headers['content-type']).toMatch(/^text\/yaml/);
    // Check YAML formatting (no braces, has colons)
    expect(getRes.text).not.toContain('{');
    expect(getRes.text).not.toContain('}');
    expect(getRes.text).toContain('name: John');
    expect(getRes.text).toContain('age: 30');
    expect(getRes.text).toContain('city: New York');
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
      /Conversion not possible for text\/plain fragment to text\/html/
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
