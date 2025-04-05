import { validateFragmentContent } from '../../src/utils/formatValidator';

describe('validateFragmentContent', () => {
  // Empty content tests
  test('should reject empty content', async () => {
    expect(await validateFragmentContent('text/plain', Buffer.from(''))).toBe(
      'Content cannot be empty'
    );
    expect(await validateFragmentContent('text/plain', Buffer.from('   '))).toBe(
      'Content cannot be empty'
    );
  });

  // Plain text tests
  test('should accept valid plain text', async () => {
    expect(await validateFragmentContent('text/plain', Buffer.from('Hello World'))).toBe('');
  });

  // JSON tests
  test('should validate JSON format', async () => {
    // Valid JSON cases
    expect(await validateFragmentContent('application/json', Buffer.from('{"key": "value"}'))).toBe(
      ''
    );
    expect(await validateFragmentContent('application/json', Buffer.from('[]'))).toBe('');
    expect(
      await validateFragmentContent('application/json', Buffer.from('{"nested": {"key": "value"}}'))
    ).toBe('');

    // Invalid JSON cases
    expect(await validateFragmentContent('application/json', Buffer.from('{"key": value}'))).toBe(
      'Invalid JSON format'
    );
    expect(await validateFragmentContent('application/json', Buffer.from('not json'))).toBe(
      'Invalid JSON format'
    );
  });

  // HTML tests
  test('should validate HTML format', async () => {
    // Valid HTML cases
    expect(await validateFragmentContent('text/html', Buffer.from('<p>Hello</p>'))).toBe('');
    expect(
      await validateFragmentContent('text/html', Buffer.from('<div><span>Nested</span></div>'))
    ).toBe('');
    expect(await validateFragmentContent('text/html', Buffer.from('<img src="test.jpg"/>'))).toBe(
      ''
    );

    // Invalid HTML cases
    expect(await validateFragmentContent('text/html', Buffer.from('<p>Unclosed tag'))).toBe(
      'Invalid HTML format'
    );
    expect(await validateFragmentContent('text/html', Buffer.from('Not HTML'))).toBe(
      'Invalid HTML format'
    );
    expect(
      await validateFragmentContent('text/html', Buffer.from('<div><span></div></span>'))
    ).toBe('Invalid HTML format');
  });

  // Markdown tests
  test('should validate Markdown format', async () => {
    // Valid Markdown cases
    expect(await validateFragmentContent('text/markdown', Buffer.from('# Heading'))).toBe('');
    expect(await validateFragmentContent('text/markdown', Buffer.from('- List item'))).toBe('');
    expect(
      await validateFragmentContent('text/markdown', Buffer.from('[Link](http://example.com)'))
    ).toBe('');
    expect(await validateFragmentContent('text/markdown', Buffer.from('**Bold text**'))).toBe('');
    expect(await validateFragmentContent('text/markdown', Buffer.from('```code block```'))).toBe(
      ''
    );

    // Invalid Markdown cases (pure HTML should be invalid markdown)
    expect(
      await validateFragmentContent(
        'text/markdown',
        Buffer.from('<html><body>Pure HTML</body></html>')
      )
    ).toBe('Invalid Markdown format');
  });

  // CSV tests
  test('should validate CSV format', async () => {
    // Valid CSV cases
    expect(
      await validateFragmentContent('text/csv', Buffer.from('header1,header2\nvalue1,value2'))
    ).toBe('');
    expect(
      await validateFragmentContent('text/csv', Buffer.from('name,age,city\nJohn,30,New York'))
    ).toBe('');

    // Valid CSV with semicolon delimiter
    expect(
      await validateFragmentContent('text/csv', Buffer.from('header1;header2\nvalue1;value2'))
    ).toBe('');

    // Invalid CSV cases
    expect(
      await validateFragmentContent(
        'text/csv',
        Buffer.from('not,a,proper\ncsv,file,missing,column')
      )
    ).toBe('Invalid CSV format');
    expect(await validateFragmentContent('text/csv', Buffer.from('just plain text'))).toBe(
      'Invalid CSV format'
    );
  });

  // Image format tests
  describe('Image Format Validation', () => {
    // PNG tests
    test('should validate PNG format', async () => {
      // Create mock PNG buffer with correct signature
      const validPNG = Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
        // Add some dummy content after the header
        0x00, 0x00, 0x00, 0x01,
      ]);

      const invalidPNG = Buffer.from([
        0x89,
        0x51,
        0x4e,
        0x47, // Invalid signature
        0x0d,
        0x0a,
        0x1a,
        0x0a,
      ]);

      expect(await validateFragmentContent('image/png', validPNG)).toBe('');
      expect(await validateFragmentContent('image/png', invalidPNG)).toBe('Invalid PNG format');
      expect(await validateFragmentContent('image/png', Buffer.from('not a png'))).toBe(
        'Invalid PNG format'
      );
    });

    // JPEG tests
    test('should validate JPEG format', async () => {
      // Create mock JPEG buffer with correct signature
      const validJPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
      const invalidJPEG = Buffer.from([0xff, 0xd9, 0xff]); // Wrong signature

      expect(await validateFragmentContent('image/jpeg', validJPEG)).toBe('');
      expect(await validateFragmentContent('image/jpeg', invalidJPEG)).toBe('Invalid JPEG format');
      expect(await validateFragmentContent('image/jpeg', Buffer.from('not a jpeg'))).toBe(
        'Invalid JPEG format'
      );
    });

    // WebP tests
    test('should validate WebP format', async () => {
      // Create mock WebP buffer with correct signature (RIFF....WEBP)
      const validWEBP = Buffer.from([
        0x52,
        0x49,
        0x46,
        0x46, // RIFF
        0x00,
        0x00,
        0x00,
        0x00, // File size (dummy)
        0x57,
        0x45,
        0x42,
        0x50, // WEBP
      ]);

      const invalidWEBP = Buffer.from([
        0x52,
        0x49,
        0x46,
        0x46, // RIFF
        0x00,
        0x00,
        0x00,
        0x00,
        0x57,
        0x45,
        0x42,
        0x51, // WEBQ (invalid)
      ]);

      expect(await validateFragmentContent('image/webp', validWEBP)).toBe('');
      expect(await validateFragmentContent('image/webp', invalidWEBP)).toBe('Invalid WEBP format');
      expect(await validateFragmentContent('image/webp', Buffer.from('not a webp'))).toBe(
        'Invalid WEBP format'
      );
    });

    // GIF tests
    test('should validate GIF format', async () => {
      // Create mock GIF buffer with correct signature
      const validGIF87a = Buffer.from([
        0x47,
        0x49,
        0x46,
        0x38,
        0x37,
        0x61, // GIF87a
      ]);

      const validGIF89a = Buffer.from([
        0x47,
        0x49,
        0x46,
        0x38,
        0x39,
        0x61, // GIF89a
      ]);

      const invalidGIF = Buffer.from([
        0x47,
        0x49,
        0x46,
        0x38,
        0x38,
        0x61, // GIF88a (invalid)
      ]);

      expect(await validateFragmentContent('image/gif', validGIF87a)).toBe('');
      expect(await validateFragmentContent('image/gif', validGIF89a)).toBe('');
      expect(await validateFragmentContent('image/gif', invalidGIF)).toBe('Invalid GIF format');
      expect(await validateFragmentContent('image/gif', Buffer.from('not a gif'))).toBe(
        'Invalid GIF format'
      );
    });

    // AVIF tests
    test('should validate AVIF format', async () => {
      // Create mock AVIF buffer with correct signature
      const validAVIF = Buffer.from([
        0x00,
        0x00,
        0x00,
        0x00, // First 4 bytes (can be any values)
        0x66,
        0x74,
        0x79,
        0x70, // ftyp at bytes 4-7
        0x6d,
        0x69,
        0x66,
        0x31, // mif1 or other values
        0x61,
        0x76,
        0x69,
        0x66, // avif at bytes 12-15
        0x00,
        0x00,
        0x00,
        0x00, // Some extra padding to ensure the loop can safely read past byte 12
      ]);

      const invalidAVIF = Buffer.from([
        0x00,
        0x00,
        0x00,
        0x00,
        0x66,
        0x74,
        0x79,
        0x70, // ftyp
        0x6d,
        0x69,
        0x66,
        0x31,
        0x78,
        0x79,
        0x7a,
        0x7a, // not avif
        0x00,
        0x00,
        0x00,
        0x00, // padding
      ]);

      expect(await validateFragmentContent('image/avif', validAVIF)).toBe('');
      expect(await validateFragmentContent('image/avif', invalidAVIF)).toBe('Invalid AVIF format');
      expect(await validateFragmentContent('image/avif', Buffer.from('not an avif'))).toBe(
        'Invalid AVIF format'
      );
    });
  });

  // Invalid type test
  test('should reject invalid types', async () => {
    expect(await validateFragmentContent('invalid/type', Buffer.from('content'))).toBe(
      'Some Invalid Format'
    );
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
    expect(await validateFragmentContent('text/html', Buffer.from(validHTML))).toBe('');
  });

  test('accepts self-closing tags', async () => {
    const validHTML = '<div><img src="image.jpg" /><br><input type="text"></div>';
    expect(await validateFragmentContent('text/html', Buffer.from(validHTML))).toBe('');
  });

  test('accepts HTML comments', async () => {
    const validHTML = '<!-- comment --><div>Content</div>';
    expect(await validateFragmentContent('text/html', Buffer.from(validHTML))).toBe('');
  });

  test('accepts DOCTYPE declarations', async () => {
    const validHTML = '<!DOCTYPE html><html><body>Content</body></html>';
    expect(await validateFragmentContent('text/html', Buffer.from(validHTML))).toBe('');
  });

  test('rejects mismatched tags', async () => {
    const invalidHTML = '<div><span>Content</div></span>';
    expect(await validateFragmentContent('text/html', Buffer.from(invalidHTML))).toBe(
      'Invalid HTML format'
    );
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
    expect(await validateFragmentContent('text/markdown', Buffer.from(validMD))).toBe('');
  });

  test('accepts Markdown tables', async () => {
    const validMD = `
| Header 1 | Header 2 |
|----------|----------|
| Cell 1   | Cell 2   |
    `;
    expect(await validateFragmentContent('text/markdown', Buffer.from(validMD))).toBe('');
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
      expect(await validateFragmentContent('text/markdown', Buffer.from(snippet))).toBe('');
    }
  });

  test('accepts Markdown with inline HTML', async () => {
    const mixedContent = `
# Heading
<div>Some HTML</div>
**Bold text**
- List item
    `;
    expect(await validateFragmentContent('text/markdown', Buffer.from(mixedContent))).toBe('');
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
    expect(await validateFragmentContent('text/markdown', Buffer.from(pureHTML))).toBe(
      'Invalid Markdown format'
    );
  });
});

describe('Edge Cases for Format Validation', () => {
  // Test for line 119: Uncovered code in isHTML with null/undefined input
  test('should handle invalid HTML input types', async () => {
    // Directly test the isHTML function by using a non-exported function pattern
    // This requires modifying your formatValidator.ts to export isHTML for testing or
    // testing indirectly through validateFragmentContent

    // Test with invalid input that would trigger the null check in isHTML
    // Since the function is not directly accessible, test through validateFragmentContent
    // with content that will eventually pass null to isHTML
    expect(await validateFragmentContent('text/html', Buffer.from(''))).toBe(
      'Content cannot be empty'
    );
  });

  // Test for line 130: Skip comments and doctype declarations in HTML
  test('should properly handle HTML with comments and DOCTYPE', async () => {
    const htmlWithCommentAndDoctype = `
      <!DOCTYPE html>
      <!-- This is a comment -->
      <html>
        <body>Valid HTML</body>
      </html>
    `;
    expect(await validateFragmentContent('text/html', Buffer.from(htmlWithCommentAndDoctype))).toBe(
      ''
    );
  });

  // Test for line 266: Truly empty content for isMarkdown
  test('should handle null or undefined content in markdown validation', async () => {
    // Test empty buffer to trigger the empty content check
    expect(await validateFragmentContent('text/markdown', Buffer.from(''))).toBe(
      'Content cannot be empty'
    );
  });

  // Test for line 285: Error handling in isCSV
  test('should handle catastrophic errors in CSV parsing', async () => {
    // Create malformed CSV content that might trigger error callback
    const malformedCSV = '\uFFFF,bad\ndata';
    expect(await validateFragmentContent('text/csv', Buffer.from(malformedCSV))).toBe(
      'Invalid CSV format'
    );
  });

  // Test for line 314: Empty buffer for PNG validation
  test('should handle empty or small buffers for image validations', async () => {
    // Test with a buffer too small to be a valid PNG
    const tooSmallPNG = Buffer.from([0x89, 0x50, 0x4e]);
    expect(await validateFragmentContent('image/png', tooSmallPNG)).toBe('Invalid PNG format');

    // Empty buffer (already covered by general empty content test)
    expect(await validateFragmentContent('image/png', Buffer.from(''))).toBe(
      'Content cannot be empty'
    );
  });

  // Test for line 342: Invalid AVIF signature check
  test('should reject AVIF with invalid ftyp signature', async () => {
    // Create a buffer that has invalid ftyp signature
    const invalidFtypAVIF = Buffer.from([
      0x00,
      0x00,
      0x00,
      0x00,
      0x65,
      0x74,
      0x79,
      0x70, // 'etyp' instead of 'ftyp'
      0x6d,
      0x69,
      0x66,
      0x31,
      0x61,
      0x76,
      0x69,
      0x66, // 'avif'
    ]);

    expect(await validateFragmentContent('image/avif', invalidFtypAVIF)).toBe(
      'Invalid AVIF format'
    );
  });

  // Edge case: Test for 'avis' brand instead of 'avif'
  test('should accept AVIF with avis brand', async () => {
    // Create a valid AVIF with 'avis' brand instead of 'avif'
    const avisAVIF = Buffer.from([
      0x00,
      0x00,
      0x00,
      0x00,
      0x66,
      0x74,
      0x79,
      0x70, // 'ftyp'
      0x6d,
      0x69,
      0x66,
      0x31,
      0x61,
      0x76,
      0x69,
      0x73, // 'avis' brand
      0x00,
      0x00,
      0x00,
      0x00, // padding
    ]);

    expect(await validateFragmentContent('image/avif', avisAVIF)).toBe('');
  });
});
