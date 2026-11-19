// @vitest-environment jsdom
// Sanitized Markdown rendering (ADR-0004 QST-FORMATTING B). These tests guard the amended
// ADR-0002 rule: model output may become HTML only after DOMPurify, because the page holds the API key.
import { describe, expect, it } from 'vitest';
import { renderInlineMarkdown, renderMarkdown } from '../src/markdown';

describe('renderMarkdown', () => {
  it('renders the Learn template: headings, bold key terms, numbered steps', () => {
    const html = renderMarkdown('### Big idea\n**ATP** is energy currency.\n\n### Step by step\n1. Glycolysis\n2. Krebs cycle');
    expect(html).toContain('<h3>Big idea</h3>');
    expect(html).toContain('<strong>ATP</strong>');
    expect(html).toMatch(/<ol>\s*<li>Glycolysis<\/li>/);
  });

  it('strips script tags, event handlers, and javascript: links from model output', () => {
    const html = renderMarkdown(
      'Hi <script>alert(localStorage.getItem("openrouter-api-key"))</script>' +
        '<img src="x" onerror="alert(1)"> [click](javascript:alert(1))',
    );
    expect(html).not.toContain('<script');
    expect(html).not.toContain('onerror');
    expect(html).not.toContain('javascript:');
  });

  it('opens links in a new tab so clicking one does not wipe the study session', () => {
    const html = renderMarkdown('[ADA](https://www.ada.org)');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
  });

  it('keeps Unicode chemistry notation intact', () => {
    expect(renderInlineMarkdown('CO₃²⁻ + 2H⁺ ⇌ H₂CO₃')).toBe('CO₃²⁻ + 2H⁺ ⇌ H₂CO₃');
  });
});
