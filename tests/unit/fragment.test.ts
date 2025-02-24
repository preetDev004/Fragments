import Fragment, { validTypes } from '../../src/model/fragment';
import { validateFragmentContent } from '../../src/utils/formatValidator';

// Wait for a certain number of ms (default 50). Feel free to change this value
// if it isn't long enough for your test runs. Returns a Promise.
const wait = async (ms = 50) => new Promise((resolve) => setTimeout(resolve, ms));

describe('Fragment class', () => {
  test('common formats are supported', () => {
    validTypes.forEach((format) => expect(Fragment.isSupportedType(format)).toBe(true));
  });

  describe('Fragment()', () => {
    test('type can be a simple media type', () => {
      const fragment = new Fragment({ ownerId: '1234', type: 'text/plain', size: 0 });
      expect(fragment.type).toEqual('text/plain');
    });

    test('type can include a charset', () => {
      const fragment = new Fragment({
        ownerId: '1234',
        type: 'text/plain; charset=utf-8',
        size: 0,
      });
      expect(fragment.type).toEqual('text/plain; charset=utf-8');
    });

    test('size gets set to 0 if missing', () => {
      const fragment = new Fragment({ ownerId: '1234', type: 'text/plain' });
      expect(fragment.size).toBe(0);
    });

    test('size can be 0', () => {
      expect(() => new Fragment({ ownerId: '1234', type: 'text/plain', size: 0 })).not.toThrow();
    });

    test('size cannot be negative', () => {
      expect(() => new Fragment({ ownerId: '1234', type: 'text/plain', size: -1 })).toThrow();
    });

    test('invalid types throw', () => {
      expect(
        () => new Fragment({ ownerId: '1234', type: 'application/msword', size: 1 })
      ).toThrow();
    });

    test('valid types can be set', () => {
      validTypes.forEach((format) => {
        const fragment = new Fragment({ ownerId: '1234', type: format, size: 1 });
        expect(fragment.type).toEqual(format);
      });
    });

    test('fragments have an id', () => {
      const fragment = new Fragment({ ownerId: '1234', type: 'text/plain', size: 1 });
      expect(fragment.id).toMatch(
        /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/
      );
    });

    test('fragments use id passed in if present', () => {
      const fragment = new Fragment({
        id: 'id',
        ownerId: '1234',
        type: 'text/plain',
        size: 1,
      });
      expect(fragment.id).toEqual('id');
    });

    test('fragments get a created datetime string', () => {
      const fragment = new Fragment({
        ownerId: '1234',
        type: 'text/plain',
        size: 1,
      });
      expect(Date.parse(fragment.created)).not.toBeNaN();
    });

    test('fragments get an updated datetime string', () => {
      const fragment = new Fragment({
        ownerId: '1234',
        type: 'text/plain',
        size: 1,
      });
      expect(Date.parse(fragment.updated)).not.toBeNaN();
    });
  });

  describe('isSupportedType()', () => {
    test('common text types are supported, with and without charset', () => {
      expect(Fragment.isSupportedType('text/plain')).toBe(true);
      expect(Fragment.isSupportedType('text/plain; charset=utf-8')).toBe(true);
    });

    test('other types are not supported', () => {
      expect(Fragment.isSupportedType('application/octet-stream')).toBe(false);
      expect(Fragment.isSupportedType('application/msword')).toBe(false);
      expect(Fragment.isSupportedType('audio/webm')).toBe(false);
      expect(Fragment.isSupportedType('video/ogg')).toBe(false);
    });
  });

  describe('mimeType, isText', () => {
    test('mimeType returns the mime type without charset', () => {
      const fragment = new Fragment({
        ownerId: '1234',
        type: 'text/plain; charset=utf-8',
        size: 0,
      });
      expect(fragment.type).toEqual('text/plain; charset=utf-8');
      expect(fragment.mimeType).toEqual('text/plain');
    });

    test('mimeType returns the mime type if charset is missing', () => {
      const fragment = new Fragment({ ownerId: '1234', type: 'text/plain', size: 0 });
      expect(fragment.type).toEqual('text/plain');
      expect(fragment.mimeType).toEqual('text/plain');
    });

    test('isText return expected results', () => {
      // Text fragment
      const fragment = new Fragment({
        ownerId: '1234',
        type: 'text/plain; charset=utf-8',
        size: 0,
      });
      expect(fragment.isText).toBe(true);
    });
  });

  describe('formats', () => {
    test('formats returns the expected result for plain text', () => {
      const fragment = new Fragment({
        ownerId: '1234',
        type: 'text/plain; charset=utf-8',
        size: 0,
      });
      expect(fragment.formats).toEqual(['text/plain']);
    });
  });

  describe('save(), getData(), setData(), byId(), byUser(), delete()', () => {
    test('byUser() returns an empty array if there are no fragments for this user', async () => {
      expect(await Fragment.byUser('1234')).toEqual([]);
    });

    test('a fragment can be created and save() stores a fragment for the user', async () => {
      const data = Buffer.from('hello');
      const fragment = new Fragment({ ownerId: '1234', type: 'text/plain', size: 0 });
      await fragment.save();
      await fragment.setData(data);

      const fragment2 = await Fragment.byId('1234', fragment.id);
      expect(fragment2).toEqual(fragment);
      expect(await fragment2.getData()).toEqual(data);
    });

    test('save() updates the updated date/time of a fragment', async () => {
      const ownerId = '7777';
      const fragment = new Fragment({ ownerId, type: 'text/plain', size: 0 });
      const modified1 = fragment.updated;
      await wait();
      await fragment.save();
      const fragment2 = await Fragment.byId(ownerId, fragment.id);
      expect(Date.parse(fragment2.updated)).toBeGreaterThan(Date.parse(modified1));
    });

    test('setData() updates the updated date/time of a fragment', async () => {
      const data = Buffer.from('hello');
      const ownerId = '7777';
      const fragment = new Fragment({ ownerId, type: 'text/plain', size: 0 });
      await fragment.save();
      const modified1 = fragment.updated;
      await wait();
      await fragment.setData(data);
      await wait();
      const fragment2 = await Fragment.byId(ownerId, fragment.id);
      expect(Date.parse(fragment2.updated)).toBeGreaterThan(Date.parse(modified1));
    });

    test("a fragment is added to the list of a user's fragments", async () => {
      const data = Buffer.from('hello');
      const ownerId = '5555';
      const fragment = new Fragment({ ownerId, type: 'text/plain', size: 0 });
      await fragment.save();
      await fragment.setData(data);

      expect(await Fragment.byUser(ownerId)).toEqual([fragment.id]);
    });

    test('full fragments are returned when requested for a user', async () => {
      const data = Buffer.from('hello');
      const ownerId = '6666';
      const fragment = new Fragment({ ownerId, type: 'text/plain', size: 0 });
      await fragment.save();
      await fragment.setData(data);

      expect(await Fragment.byUser(ownerId, true)).toEqual([fragment]);
    });

    test('setData() updates the fragment size', async () => {
      const fragment = new Fragment({ ownerId: '1234', type: 'text/plain', size: 0 });
      await fragment.save();
      await fragment.setData(Buffer.from('a'));
      expect(fragment.size).toBe(1);

      await fragment.setData(Buffer.from('aa'));
      const { size } = await Fragment.byId('1234', fragment.id);
      expect(size).toBe(2);
    });

    test('a fragment can be deleted', async () => {
      const fragment = new Fragment({ ownerId: '1234', type: 'text/plain', size: 0 });
      await fragment.save();
      await fragment.setData(Buffer.from('a'));

      await Fragment.delete('1234', fragment.id);
      expect(() => Fragment.byId('1234', fragment.id)).rejects.toThrow();
    });
  });
  describe('validateFragmentContent()', () => {
    test('accepts valid plain text', () => {
      expect(validateFragmentContent('text/plain', 'Hello World')).toBe('');
    });

    test('accepts valid JSON', () => {
      expect(validateFragmentContent('application/json', '{"key": "value"}')).toBe('');
    });

    test('rejects invalid JSON', () => {
      expect(validateFragmentContent('application/json', '{"key": value')).toBe(
        'Invalid JSON format'
      );
    });

    test('accepts valid HTML', () => {
      const validHTML = '<div><p>Hello World</p></div>';
      expect(validateFragmentContent('text/html', validHTML)).toBe('');
    });

    test('rejects invalid HTML', () => {
      const invalidHTML = '<div><p>Hello World</div>';
      expect(validateFragmentContent('text/html', invalidHTML)).toBe('Invalid HTML format');
    });

    test('accepts valid Markdown', () => {
      const validMD = '# Header\n\nThis is a paragraph with **bold** text.';
      expect(validateFragmentContent('text/markdown', validMD)).toBe('');
    });

    test('rejects invalid Markdown', () => {
      // Pure HTML should be rejected as Markdown
      const invalidMD = '<html><body>Not markdown</body></html>';
      expect(validateFragmentContent('text/markdown', invalidMD)).toBe('Invalid Markdown format');
    });

    test('rejects unsupported type', () => {
      expect(validateFragmentContent('image/jpeg', 'content')).toBe('Some Invalid Format');
    });
  });
  describe('HTML Validation', () => {
    test('accepts valid HTML with nested tags', () => {
      const validHTML = `
        <div class="container">
          <h1>Title</h1>
          <p>Paragraph <strong>with bold</strong> text</p>
        </div>
      `;
      expect(validateFragmentContent('text/html', validHTML)).toBe('');
    });

    test('accepts self-closing tags', () => {
      const validHTML = '<div><img src="image.jpg" /><br><input type="text"></div>';
      expect(validateFragmentContent('text/html', validHTML)).toBe('');
    });

    test('accepts HTML comments', () => {
      const validHTML = '<!-- comment --><div>Content</div>';
      expect(validateFragmentContent('text/html', validHTML)).toBe('');
    });

    test('accepts DOCTYPE declarations', () => {
      const validHTML = '<!DOCTYPE html><html><body>Content</body></html>';
      expect(validateFragmentContent('text/html', validHTML)).toBe('');
    });

    test('rejects mismatched tags', () => {
      const invalidHTML = '<div><span>Content</div></span>';
      expect(validateFragmentContent('text/html', invalidHTML)).toBe('Invalid HTML format');
    });
  });

  describe('Markdown Validation', () => {
    test('accepts common Markdown syntax', () => {
      const validMD = `
# Header

## Subheader

- List item 1
- List item 2

> Blockquote

\`\`\`
code block
\`\`\`

**Bold** and *italic*

[Link](https://example.com)
      `;
      expect(validateFragmentContent('text/markdown', validMD)).toBe('');
    });

    test('accepts Markdown tables', () => {
      const validMD = `
| Header 1 | Header 2 |
|----------|----------|
| Cell 1   | Cell 2   |
      `;
      expect(validateFragmentContent('text/markdown', validMD)).toBe('');
    });

    test('accepts short Markdown snippets', () => {
      const snippets = [
        '# Header',
        '> Quote',
        '- List item',
        '1. Numbered item',
        '```code```',
        '[link](url)',
        '![image](url)',
      ];

      snippets.forEach((snippet) => {
        expect(validateFragmentContent('text/markdown', snippet)).toBe('');
      });
    });

    test('accepts Markdown with inline HTML', () => {
      const mixedContent = `
# Header

<div class="custom">
  This is a paragraph with **bold** text
</div>

- List item
      `;
      expect(validateFragmentContent('text/markdown', mixedContent)).toBe('');
    });

    test('rejects pure HTML content as Markdown', () => {
      const pureHTML = `
<!DOCTYPE html>
<html>
<head><title>Title</title></head>
<body>
  <div>Content</div>
</body>
</html>
      `;
      expect(validateFragmentContent('text/markdown', pureHTML)).toBe('Invalid Markdown format');
    });
  });
});
