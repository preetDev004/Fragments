import MarkdownIt from 'markdown-it';
import yaml from 'js-yaml'; // You'll need to install this package

// Helper function to convert extension to mime type
export function extToMimeType(ext: string): string {
  const extToMimeMap: Record<string, string> = {
    html: 'text/html',
    txt: 'text/plain',
    json: 'application/json',
    yaml: 'text/yaml',
    yml: 'text/yaml',
    md: 'text/markdown',
    csv: 'text/csv',
  };

  return extToMimeMap[ext] || `text/${ext}`;
}

// Markdown to HTML conversion
export function markdownToHtml(content: string): string {
  const md = new MarkdownIt();
  return md.render(content);
}

// Markdown to plain text (strip markdown formatting)
export function markdownToText(content: string): string {
  // Simple markdown to text - removes common markdown syntax
  return content
    .replace(/#+\s+(.*)/g, '$1') // Remove headings
    .replace(/\*\*(.*)\*\*/g, '$1') // Remove bold
    .replace(/\*(.*)\*/g, '$1') // Remove italic
    .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Remove links
    .replace(/^>\s*(.*)/gm, '$1') // Remove blockquotes
    .replace(/^-\s+(.*)/gm, '• $1') // Convert list items
    .replace(/^```[\s\S]*?```/gm, '') // Remove code blocks
    .trim();
}

// HTML to plain text (strip HTML tags)
export function htmlToText(content: string): string {
  return content
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&nbsp;/g, ' ') // Replace non-breaking spaces
    .replace(/&lt;/g, '<') // Replace HTML entities
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"') // Add this line to convert &quot; to "
    .trim();
}

// CSV to JSON conversion
export function csvToJson(content: string): string {
  const lines = content.trim().split('\n');
  const headers = lines[0].split(',').map((header) => header.trim());
  const result = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map((value) => value.trim());
    const row: Record<string, string> = {};

    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });

    result.push(row);
  }

  return JSON.stringify(result, null, 2);
}

// CSV to plain text (already plain text, just ensure consistency)
export function csvToText(content: string): string {
  return content;
}

// JSON to YAML conversion
export function jsonToYaml(content: string): string {
  const jsonObj = JSON.parse(content);
  return yaml.dump(jsonObj);
}

// JSON to plain text
export function jsonToText(content: string): string {
  try {
    const obj = JSON.parse(content);
    return JSON.stringify(obj, null, 2);
  } catch (e: unknown) {
    console.error('Invalid JSON format:', e);
    return content;
  }
}

// YAML to plain text
export function yamlToText(content: string): string {
  return content;
}
