import { validateFragmentContent } from '../../src/utils/formatValidator';

describe('validateFragmentContent', () => {
  // Empty content tests
  test('should reject empty content', async () => {
    expect(await validateFragmentContent('text/plain', '')).toBe('Content cannot be empty');
    expect(await validateFragmentContent('text/plain', '   ')).toBe('Content cannot be empty');
  });

  // Plain text tests
  test('should accept valid plain text', async () => {
    expect(await validateFragmentContent('text/plain', 'Hello World')).toBe('');
  });

  // JSON tests
  test('should validate JSON format', async () => {
    // Valid JSON cases
    expect(await validateFragmentContent('application/json', '{"key": "value"}')).toBe('');
    expect(await validateFragmentContent('application/json', '[]')).toBe('');
    expect(await validateFragmentContent('application/json', '{"nested": {"key": "value"}}')).toBe(
      ''
    );

    // Invalid JSON cases
    expect(await validateFragmentContent('application/json', '{"key": value}')).toBe(
      'Invalid JSON format'
    );
    expect(await validateFragmentContent('application/json', 'not json')).toBe(
      'Invalid JSON format'
    );
  });

  // HTML tests
  test('should validate HTML format', async () => {
    // Valid HTML cases
    expect(await validateFragmentContent('text/html', '<p>Hello</p>')).toBe('');
    expect(await validateFragmentContent('text/html', '<div><span>Nested</span></div>')).toBe('');
    expect(await validateFragmentContent('text/html', '<img src="test.jpg"/>')).toBe('');

    // Invalid HTML cases
    expect(await validateFragmentContent('text/html', '<p>Unclosed tag')).toBe(
      'Invalid HTML format'
    );
    expect(await validateFragmentContent('text/html', 'Not HTML')).toBe('Invalid HTML format');
    expect(await validateFragmentContent('text/html', '<div><span></div></span>')).toBe(
      'Invalid HTML format'
    );
  });

  // Markdown tests
  test('should validate Markdown format', async () => {
    // Valid Markdown cases
    expect(await validateFragmentContent('text/markdown', '# Heading')).toBe('');
    expect(await validateFragmentContent('text/markdown', '- List item')).toBe('');
    expect(await validateFragmentContent('text/markdown', '[Link](http://example.com)')).toBe('');
    expect(await validateFragmentContent('text/markdown', '**Bold text**')).toBe('');
    expect(await validateFragmentContent('text/markdown', '```code block```')).toBe('');

    // Invalid Markdown cases (pure HTML should be invalid markdown)
    expect(
      await validateFragmentContent('text/markdown', '<html><body>Pure HTML</body></html>')
    ).toBe('Invalid Markdown format');
  });

  // CSV tests
  test('should validate CSV format', async () => {
    // Valid CSV cases
    expect(await validateFragmentContent('text/csv', 'header1,header2\nvalue1,value2')).toBe('');
    expect(await validateFragmentContent('text/csv', 'name,age,city\nJohn,30,New York')).toBe('');

    // Valid CSV with semicolon delimiter
    expect(await validateFragmentContent('text/csv', 'header1;header2\nvalue1;value2')).toBe('');

    // Invalid CSV cases
    expect(await validateFragmentContent('text/csv', 'not,a,proper\ncsv,file,missing,column')).toBe(
      'Invalid CSV format'
    );
    expect(await validateFragmentContent('text/csv', 'just plain text')).toBe('Invalid CSV format');
  });

  // Invalid type test
  test('should reject invalid types', async () => {
    expect(await validateFragmentContent('invalid/type', 'content')).toBe('Some Invalid Format');
  });
});

describe('HTML Validation', () => {
  test('accepts valid HTML with nested tags', async () => {
    const validHTML = `
      <div>
        <p>Hello</p>
        <span>World</span>
      </div>
    `;
    expect(await validateFragmentContent('text/html', validHTML)).toBe('');
  });

  test('accepts self-closing tags', async () => {
    const validHTML = '<div><img src="image.jpg" /><br><input type="text"></div>';
    expect(await validateFragmentContent('text/html', validHTML)).toBe('');
  });

  test('accepts HTML comments', async () => {
    const validHTML = '<!-- comment --><div>Content</div>';
    expect(await validateFragmentContent('text/html', validHTML)).toBe('');
  });

  test('accepts DOCTYPE declarations', async () => {
    const validHTML = '<!DOCTYPE html><html><body>Content</body></html>';
    expect(await validateFragmentContent('text/html', validHTML)).toBe('');
  });

  test('rejects mismatched tags', async () => {
    const invalidHTML = '<div><span>Content</div></span>';
    expect(await validateFragmentContent('text/html', invalidHTML)).toBe('Invalid HTML format');
  });
});

describe('Markdown Validation', () => {
  test('accepts common Markdown syntax', async () => {
    const validMD = `
# Heading
**Bold text**
*Italic text*
[Link](https://example.com)
    `;
    expect(await validateFragmentContent('text/markdown', validMD)).toBe('');
  });

  test('accepts Markdown tables', async () => {
    const validMD = `
| Header 1 | Header 2 |
|----------|----------|
| Cell 1   | Cell 2   |
    `;
    expect(await validateFragmentContent('text/markdown', validMD)).toBe('');
  });

  test('accepts short Markdown snippets', async () => {
    const snippets = [
      '# Heading',
      '> Blockquote',
      '- List item',
      '1. Numbered item',
      '```code```',
      '[Link](url)',
      '![Image](url)',
      '**Bold**',
      '*Italic*',
    ];

    for (const snippet of snippets) {
      expect(await validateFragmentContent('text/markdown', snippet)).toBe('');
    }
  });

  test('accepts Markdown with inline HTML', async () => {
    const mixedContent = `
# Heading
<div>Some HTML</div>
**Bold text**
- List item
    `;
    expect(await validateFragmentContent('text/markdown', mixedContent)).toBe('');
  });

  test('rejects pure HTML content as Markdown', async () => {
    const pureHTML = `
<!DOCTYPE html>
<html>
<head><title>Test</title></head>
<body>
  <div>Pure HTML content</div>
</body>
</html>
    `;
    expect(await validateFragmentContent('text/markdown', pureHTML)).toBe(
      'Invalid Markdown format'
    );
  });
});
