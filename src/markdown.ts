// Model output → sanitized HTML (ADR-0004 QST-FORMATTING B; amends ADR-0002's rendering rule).
// The ONLY path by which model text may reach innerHTML. User-typed text never comes through here.
import { marked } from 'marked';
import DOMPurify from 'dompurify';

marked.setOptions({ gfm: true, breaks: true });

// Links open in a new tab so clicking one never navigates away from (and loses) the session.
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName === 'A') {
    node.setAttribute('target', '_blank');
    node.setAttribute('rel', 'noopener noreferrer');
  }
});

export function renderMarkdown(text: string): string {
  return DOMPurify.sanitize(marked.parse(text, { async: false }) as string);
}

/** For short single-line strings such as quiz choices: no wrapping <p>. */
export function renderInlineMarkdown(text: string): string {
  return DOMPurify.sanitize(marked.parseInline(text, { async: false }) as string);
}
