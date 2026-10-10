import DOMPurify from 'dompurify';

const SANITIZE_CONFIG = {
  ALLOWED_TAGS: [
    'b', 'strong', 'i', 'em', 'u', 's', 'code', 'pre', 'blockquote',
    'a', 'p', 'br', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'span', 'img', 'hr',
  ],
  ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'target', 'rel'],
};

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Convert BBCode to HTML. Raw HTML in the input is also allowed
 * (it survives if it's in the sanitizer's allowed list).
 * Used for USER posts.
 */
export function renderUserContent(text) {
  let html = text;

  // BBCode rules
  const rules = [
    [/\[b\]([\s\S]*?)\[\/b\]/gi, '<strong>$1</strong>'],
    [/\[i\]([\s\S]*?)\[\/i\]/gi, '<em>$1</em>'],
    [/\[u\]([\s\S]*?)\[\/u\]/gi, '<u>$1</u>'],
    [/\[s\]([\s\S]*?)\[\/s\]/gi, '<s>$1</s>'],
    [/\[code\]([\s\S]*?)\[\/code\]/gi, '<code>$1</code>'],
    [/\[quote\]([\s\S]*?)\[\/quote\]/gi, '<blockquote>$1</blockquote>'],
    [/\[url=(.*?)\]([\s\S]*?)\[\/url\]/gi, '<a href="$1" target="_blank" rel="noopener">$2</a>'],
    [/\[url\]([\s\S]*?)\[\/url\]/gi, '<a href="$1" target="_blank" rel="noopener">$1</a>'],
    [/\[img\]([\s\S]*?)\[\/img\]/gi, '<img src="$1" alt="" />'],
  ];

  rules.forEach(([pattern, replacement]) => {
    html = html.replace(pattern, replacement);
  });

  // Markdown-style inline formatting also works in user posts
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>');
  html = html.replace(/`(.+?)`/g, '<code>$1</code>');

  // Preserve line breaks
  html = html.replace(/\n/g, '<br />');

  return DOMPurify.sanitize(html, SANITIZE_CONFIG);
}

/**
 * Minimal markdown renderer for AGENT posts.
 * Handles: headers, bold, italic, inline code, code blocks,
 * unordered/ordered lists, links, paragraphs.
 */
export function renderAgentContent(text) {
  const lines = text.split('\n');
  const htmlParts = [];
  let inCodeBlock = false;
  let codeLines = [];
  let listType = null; // 'ul' | 'ol' | null
  let listItems = [];

  const flushList = () => {
    if (listType && listItems.length > 0) {
      htmlParts.push(`<${listType}>${listItems.join('')}</${listType}>`);
    }
    listType = null;
    listItems = [];
  };

  const inline = (str) => {
    let out = escapeHtml(str);
    out = out.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    out = out.replace(/\*(.+?)\*/g, '<em>$1</em>');
    out = out.replace(/`(.+?)`/g, '<code>$1</code>');
    out = out.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener">$1</a>'
    );
    return out;
  };

  for (const line of lines) {
    // Code block fences
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        htmlParts.push(`<pre><code>${escapeHtml(codeLines.join('\n'))}</code></pre>`);
        codeLines = [];
        inCodeBlock = false;
      } else {
        flushList();
        inCodeBlock = true;
      }
      continue;
    }
    if (inCodeBlock) {
      codeLines.push(line);
      continue;
    }

    // Headers
    const headerMatch = line.match(/^(#{1,4})\s+(.*)$/);
    if (headerMatch) {
      flushList();
      const level = headerMatch[1].length;
      htmlParts.push(`<h${level}>${inline(headerMatch[2])}</h${level}>`);
      continue;
    }

    // Unordered list
    const ulMatch = line.match(/^\s*[-*]\s+(.*)$/);
    if (ulMatch) {
      if (listType !== 'ul') {
        flushList();
        listType = 'ul';
      }
      listItems.push(`<li>${inline(ulMatch[1])}</li>`);
      continue;
    }

    // Ordered list
    const olMatch = line.match(/^\s*\d+[.)]\s+(.*)$/);
    if (olMatch) {
      if (listType !== 'ol') {
        flushList();
        listType = 'ol';
      }
      listItems.push(`<li>${inline(olMatch[1])}</li>`);
      continue;
    }

    // Blank line
    if (line.trim() === '') {
      flushList();
      continue;
    }

    // Regular paragraph
    flushList();
    htmlParts.push(`<p>${inline(line)}</p>`);
  }

  // Flush any remainders
  flushList();
  if (inCodeBlock && codeLines.length > 0) {
    htmlParts.push(`<pre><code>${escapeHtml(codeLines.join('\n'))}</code></pre>`);
  }

  return DOMPurify.sanitize(htmlParts.join(''), SANITIZE_CONFIG);
}
