import Papa from 'papaparse';
import { validTypes } from '../model/fragment';

export const validateFragmentContent = async (
  type: (typeof validTypes)[number],
  content: Buffer
): Promise<string> => {
  if (Buffer.isBuffer(content) && (content.length === 0 || content.toString().trim().length === 0))
    return 'Content cannot be empty';

  switch (type) {
    case 'text/plain':
      break;

    case 'application/json':
      try {
        JSON.parse(content.toString());
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
      if (!(await isCSV(content.toString())).isValid) {
        return 'Invalid CSV format';
      }
      break;

    case 'image/png':
      if (!isPNG(content)) {
        return 'Invalid PNG format';
      }
      break;

    case 'image/jpeg':
      if (!isJPEG(content)) {
        return 'Invalid JPEG format';
      }
      break;

    case 'image/webp':
      if (!isWEBP(content)) {
        return 'Invalid WEBP format';
      }
      break;

    case 'image/gif':
      if (!isGIF(content)) {
        return 'Invalid GIF format';
      }
      break;

    case 'image/avif':
      if (!isAVIF(content)) {
        return 'Invalid AVIF format';
      }
      break;

    default:
      return 'Some Invalid Format';
  }

  return '';
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
const isCSV = (text: string): Promise<{ isValid: boolean }> => {
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
          resolve({ isValid: false });
        } else if (results.data.length === 0) {
          // No data rows found
          resolve({ isValid: false });
        } else {
          // Successfully parsed as CSV
          resolve({ isValid: true });
        }
      },

      // Error callback - if parsing fails catastrophically
      error: (error: Error) => {
        console.error('Fatal parsing error:', error.message);
        resolve({ isValid: false });
      },
    });
  });
};

// Validate PNG format by checking the file signature
const isPNG = (data: Buffer): boolean => {
  if (!Buffer.isBuffer(data) || data.length < 8) {
    return false;
  }

  // Check PNG signature: 89 50 4E 47 0D 0A 1A 0A
  return (
    data[0] === 0x89 &&
    data[1] === 0x50 &&
    data[2] === 0x4e &&
    data[3] === 0x47 &&
    data[4] === 0x0d &&
    data[5] === 0x0a &&
    data[6] === 0x1a &&
    data[7] === 0x0a
  );
};

// Validate JPEG format by checking the file signature
const isJPEG = (data: Buffer): boolean => {
  if (!Buffer.isBuffer(data) || data.length < 3) {
    return false;
  }

  // JPEG starts with FF D8 FF
  return data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff;
};

// Validate WebP format by checking the file signature
const isWEBP = (data: Buffer): boolean => {
  if (!Buffer.isBuffer(data) || data.length < 12) {
    return false;
  }

  // Check WebP signature: RIFF....WEBP
  return (
    data[0] === 0x52 && // R
    data[1] === 0x49 && // I
    data[2] === 0x46 && // F
    data[3] === 0x46 && // F
    data[8] === 0x57 && // W
    data[9] === 0x45 && // E
    data[10] === 0x42 && // B
    data[11] === 0x50 // P
  );
};

// Validate GIF format by checking the file signature
const isGIF = (data: Buffer): boolean => {
  if (!Buffer.isBuffer(data) || data.length < 6) {
    return false;
  }

  // Check for GIF87a or GIF89a signature
  return (
    data[0] === 0x47 && // G
    data[1] === 0x49 && // I
    data[2] === 0x46 && // F
    data[3] === 0x38 && // 8
    (data[4] === 0x37 || data[4] === 0x39) && // 7 or 9
    data[5] === 0x61 // a
  );
};

// Validate AVIF format by checking the file signature
const isAVIF = (data: Buffer): boolean => {
  if (!Buffer.isBuffer(data) || data.length < 12) {
    return false;
  }

  // First check for the FTYPBOX signature
  const hasFtypSignature =
    data[4] === 0x66 && // f
    data[5] === 0x74 && // t
    data[6] === 0x79 && // y
    data[7] === 0x70; // p

  if (!hasFtypSignature) {
    return false;
  }

  // Then look for 'avif' or 'avis' brand
  // It can be at different positions, but typically occurs at offset 8 or 12
  for (let i = 8; i < Math.min(data.length - 4, 24); i++) {
    if (
      (data[i] === 0x61 && data[i + 1] === 0x76 && data[i + 2] === 0x69 && data[i + 3] === 0x66) || // 'avif'
      (data[i] === 0x61 && data[i + 1] === 0x76 && data[i + 2] === 0x69 && data[i + 3] === 0x73) // 'avis'
    ) {
      return true;
    }
  }

  return false;
};
