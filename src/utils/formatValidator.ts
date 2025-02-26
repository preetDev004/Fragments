import { validTypes } from '../model/fragment';
import Papa from 'papaparse';

export const validateFragmentContent = async (
  type: (typeof validTypes)[number],
  content: string
): Promise<string> => {
  if (!content.trim()) return "Content cannot be empty";

  switch (type) {
    case 'text/plain':
      break;

    case 'application/json':
      try {
        JSON.parse(content);
      } catch {
        return 'Invalid JSON format';
      }
      break;

    case 'text/html':
      if (!isHTML(content.toString())) {
        return 'Invalid HTML format';
      }
      break;

    case 'text/markdown':
      if (!isMarkdown(content.toString())) {
        return 'Invalid Markdown format';
      }
      break;

    case 'text/csv':
      if (!((await isCSV(content)).isValid)) {
        return 'Invalid CSV format';
      }
      break;

    default:
      return 'Some Invalid Format';
  }

  return "";
};

const isHTML = (text: string) => {
  if (!text || typeof text !== 'string') return false;

  // Trim the input
  const trimmedText = text.trim();

  // Extract all tags for analysis
  const tagPattern = /<\/?([a-z][a-z0-9]*)(?:\s+[^>]*)?\/?>/gi;
  const tagMatches = [...trimmedText.matchAll(tagPattern)];

  if (tagMatches.length === 0) {
    return false; // No HTML tags found
  }

  // Track opening/closing tags
  const stack = [];

  // Self-closing tags don't need matching closing tags
  const selfClosingTags = new Set([
    'area',
    'base',
    'br',
    'col',
    'embed',
    'hr',
    'img',
    'input',
    'link',
    'meta',
    'param',
    'source',
    'track',
    'wbr',
  ]);

  for (const match of tagMatches) {
    const fullTag = match[0];
    const tagName = match[1].toLowerCase();

    // Skip comments and doctype declarations
    if (fullTag.startsWith('<!--') || fullTag.startsWith('<!DOCTYPE')) {
      continue;
    }

    // Check if it's a self-closing tag (either by tag name or /> syntax)
    if (selfClosingTags.has(tagName) || fullTag.endsWith('/>')) {
      continue;
    }

    // Check if it's a closing tag
    if (fullTag.startsWith('</')) {
      if (stack.length === 0) {
        return false; // Closing tag without matching opening tag
      }

      const lastOpenTag = stack.pop();
      if (lastOpenTag !== tagName) {
        return false; // Tags not properly nested
      }

      continue;
    }

    // It's an opening tag
    stack.push(tagName);
  }

  // If we have unclosed tags, it's not valid HTML
  return stack.length === 0;
};

const isMarkdown = (text: string) => {
  if (!text || typeof text !== 'string') return false;

  // Trim the input
  const trimmedText = text.trim();

  // If it's very likely HTML and not ambiguous, return false early
  if (
    /<\/?html>|<\/?body>|<\/?head>|<!DOCTYPE/i.test(trimmedText) ||
    (trimmedText.startsWith('<') && trimmedText.endsWith('>') && trimmedText.length > 10)
  ) {
    return false;
  }

  // Check for common Markdown syntax
  const headingRegex = /^#{1,6}\s+.+$/m;
  const linkRegex = /\[.+?\]\(.+?\)/;
  const imageRegex = /!\[.+?\]\(.+?\)/;
  const boldRegex = /\*\*[^*\n]+?\*\*|__[^_\n]+?__/;
  const italicRegex = /\*[^*\n]+?\*|_[^_\n]+?_/;
  const blockquoteRegex = /^>\s+.+$/m;
  const codeBlockRegex = /```[\s\S]*?```|`[^`\n]+?`/;
  const listRegex = /^[\s]*([-*+]|\d+\.)\s+.+$/m;
  const horizontalRuleRegex = /^[-*_]{3,}$/m;
  const tableRegex = /\|.+\|.*\n\|[-:]+\|/;

  // For very short inputs, check for specific Markdown starters
  if (trimmedText.length < 20) {
    if (
      trimmedText.startsWith('#') ||
      trimmedText.startsWith('>') ||
      trimmedText.startsWith('- ') ||
      trimmedText.startsWith('* ') ||
      trimmedText.startsWith('1. ') ||
      trimmedText.startsWith('```') ||
      (trimmedText.startsWith('[') && trimmedText.includes('](')) ||
      (trimmedText.startsWith('![') && trimmedText.includes(']('))
    ) {
      return true;
    }
  }

  // Check for multiple Markdown features
  const markdownFeatures = [
    headingRegex.test(trimmedText),
    linkRegex.test(trimmedText),
    imageRegex.test(trimmedText),
    boldRegex.test(trimmedText),
    italicRegex.test(trimmedText),
    blockquoteRegex.test(trimmedText),
    codeBlockRegex.test(trimmedText),
    listRegex.test(trimmedText),
    horizontalRuleRegex.test(trimmedText),
    tableRegex.test(trimmedText),
  ];

  // Count Markdown features
  const featureCount = markdownFeatures.filter(Boolean).length;

  // If it contains some HTML but has clear Markdown features, treat as Markdown
  if (isHTML(trimmedText) && featureCount >= 1) {
    // Additional checks to resolve ambiguity
    const htmlDominance = (trimmedText.match(/<[^>]+>/g) || []).length;
    const markdownSpecificSyntax =
      headingRegex.test(trimmedText) ||
      listRegex.test(trimmedText) ||
      blockquoteRegex.test(trimmedText) ||
      tableRegex.test(trimmedText);

    return markdownSpecificSyntax || featureCount > htmlDominance;
  }

  // Return true if any Markdown feature is present
  return featureCount > 0;
};
// Validate a string containing potential CSV content
const isCSV = (text: string): Promise<{isValid: boolean}> => {
  // No need to check file type or extension since we're working with a string directly
  
  return new Promise((resolve) => {
    // Try parsing with PapaParse directly from the string
    Papa.parse(text, {
      // Try to auto-detect the delimiter (comma or semicolon)
      delimiter: text.includes(';') ? ';' : ',',
      header: true, // Parse the first row as headers
      skipEmptyLines: true,
      
      // Complete callback - called when parsing is finished
      complete: (results) => {
        console.log('Parsed CSV content:', results.data);
        
        // Check if PapaParse encountered errors or if data looks valid
        if (results.errors.length > 0) {
          console.error('CSV parsing errors:', results.errors);
          // File couldn't be parsed properly
          resolve({isValid: false});
        } else if (results.data.length === 0) {
          // No data rows found
          resolve({isValid: false});
        } else {
          // Successfully parsed as CSV
          resolve({isValid: true});
        }
      },
      
      // Error callback - if parsing fails catastrophically
      error: (error: Error) => {
        console.error('Fatal parsing error:', error.message);
        resolve({isValid: false});
      }
    });
  });
};
