import {
  extToMimeType,
  markdownToHtml,
  markdownToText,
  htmlToText,
  csvToJson,
  csvToText,
  jsonToYaml,
  jsonToText,
  yamlToText,
} from '../../src/utils/converter';

describe('Converter Utilities', () => {
  describe('extToMimeType', () => {
    test('converts common extensions to correct MIME types', () => {
      expect(extToMimeType('html')).toBe('text/html');
      expect(extToMimeType('txt')).toBe('text/plain');
      expect(extToMimeType('json')).toBe('application/json');
      expect(extToMimeType('yaml')).toBe('text/yaml');
      expect(extToMimeType('yml')).toBe('text/yaml');
      expect(extToMimeType('md')).toBe('text/markdown');
      expect(extToMimeType('csv')).toBe('text/csv');
    });

    test('handles unknown extensions by prefixing with text/', () => {
      expect(extToMimeType('unknown')).toBe('text/unknown');
    });
  });

  describe('markdownToHtml', () => {
    test('converts basic markdown to HTML', () => {
      const markdown = '# Heading\n\nParagraph with **bold** and *italic* text.';
      const html = markdownToHtml(markdown);

      expect(html).toContain('<h1>Heading</h1>');
      expect(html).toContain(
        '<p>Paragraph with <strong>bold</strong> and <em>italic</em> text.</p>'
      );
    });

    test('handles markdown lists', () => {
      const markdown = '- Item 1\n- Item 2\n- Item 3';
      const html = markdownToHtml(markdown);

      expect(html).toContain('<ul>');
      expect(html).toContain('<li>Item 1</li>');
      expect(html).toContain('<li>Item 2</li>');
      expect(html).toContain('<li>Item 3</li>');
      expect(html).toContain('</ul>');
    });
  });

  describe('markdownToText', () => {
    test('converts markdown to plain text by stripping formatting', () => {
      const markdown = '# Heading\n\nParagraph with **bold** and *italic* text.';
      const text = markdownToText(markdown);

      expect(text).not.toContain('#');
      expect(text).not.toContain('**');
      expect(text).not.toContain('*');
      expect(text).toContain('Heading');
      expect(text).toContain('Paragraph with bold and italic text.');
    });

    test('converts markdown lists to plain text', () => {
      const markdown = '- Item 1\n- Item 2\n- Item 3';
      const text = markdownToText(markdown);

      expect(text).not.toContain('-');
      expect(text).toContain('• Item 1');
      expect(text).toContain('• Item 2');
      expect(text).toContain('• Item 3');
    });

    test('removes code blocks', () => {
      const markdown = 'Text before\n```\ncode block\n```\nText after';
      const text = markdownToText(markdown);

      expect(text).not.toContain('```');
      expect(text).not.toContain('code block');
      expect(text).toContain('Text before');
      expect(text).toContain('Text after');
    });
  });

  describe('htmlToText', () => {
    test('strips HTML tags', () => {
      const html =
        '<h1>Heading</h1><p>This is a <strong>paragraph</strong> with <em>formatting</em>.</p>';
      const text = htmlToText(html);

      expect(text).not.toContain('<');
      expect(text).not.toContain('>');
      expect(text).toContain('Heading');
      expect(text).toContain('This is a paragraph with formatting.');
    });

    test('converts HTML entities', () => {
      const html = '&lt;script&gt; alert(&quot;hello&quot;); &lt;/script&gt;&nbsp;text';
      const text = htmlToText(html);

      expect(text).toContain('<script> alert("hello"); </script> text');
    });
  });

  describe('csvToJson', () => {
    test('converts simple CSV to JSON array of objects', () => {
      const csv = 'name,age,city\nJohn,30,New York\nJane,25,Boston';
      const jsonStr = csvToJson(csv);
      const json = JSON.parse(jsonStr);

      expect(Array.isArray(json)).toBe(true);
      expect(json.length).toBe(2);
      expect(json[0]).toEqual({ name: 'John', age: '30', city: 'New York' });
      expect(json[1]).toEqual({ name: 'Jane', age: '25', city: 'Boston' });
    });

    test('handles empty cells', () => {
      const csv = 'name,age,city\nJohn,30,\nJane,,Boston';
      const jsonStr = csvToJson(csv);
      const json = JSON.parse(jsonStr);

      expect(json[0]).toEqual({ name: 'John', age: '30', city: '' });
      expect(json[1]).toEqual({ name: 'Jane', age: '', city: 'Boston' });
    });
  });

  describe('csvToText', () => {
    test('returns the original CSV string', () => {
      const csv = 'name,age,city\nJohn,30,New York\nJane,25,Boston';
      const text = csvToText(csv);

      expect(text).toEqual(csv);
    });
  });

  describe('jsonToYaml', () => {
    test('converts JSON object to YAML', () => {
      const json = '{"name":"John","age":30,"address":{"city":"New York","zip":10001}}';
      const yaml = jsonToYaml(json);

      expect(yaml).toContain('name: John');
      expect(yaml).toContain('age: 30');
      expect(yaml).toContain('address:');
      expect(yaml).toContain('city: New York');
      expect(yaml).toContain('zip: 10001');
      expect(yaml).not.toContain('{');
      expect(yaml).not.toContain('}');
    });

    test('converts JSON array to YAML', () => {
      const json = '[{"name":"John"},{"name":"Jane"}]';
      const yaml = jsonToYaml(json);

      expect(yaml).toContain('- name: John');
      expect(yaml).toContain('- name: Jane');
    });
  });

  describe('jsonToText', () => {
    test('formats JSON with indentation', () => {
      const json = '{"name":"John","age":30}';
      const text = jsonToText(json);

      expect(text).toContain('"name": "John"');
      expect(text).toContain('"age": 30');
      // Check for proper formatting (indentation)
      expect(text.split('\n').length).toBeGreaterThan(1);
    });

    test('handles invalid JSON by returning the original string', () => {
      const invalidJson = '{name:John}'; // Missing quotes
      const text = jsonToText(invalidJson);

      expect(text).toBe(invalidJson);
    });
  });

  describe('yamlToText', () => {
    test('returns the original YAML string', () => {
      const yaml = 'name: John\nage: 30\ncity: New York';
      const text = yamlToText(yaml);

      expect(text).toEqual(yaml);
    });
  });
});
