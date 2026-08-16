import { Theme } from './theme-types';

function appendStyle(element: Element, style: string | undefined): void {
  if (!style) return;
  const current = element.getAttribute('style')?.trim() || '';
  element.setAttribute('style', [current, style].filter(Boolean).join(';'));
}

function applySelectorStyles(doc: Document, theme: Theme): void {
  Object.entries(theme.styles).forEach(([selector, style]) => {
    if (!style) return;
    doc.querySelectorAll(selector).forEach((element) => appendStyle(element, style));
  });
}

function transformPlusUnderlines(doc: Document): void {
  const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
  const candidates: Text[] = [];
  let current = walker.nextNode();

  while (current) {
    const textNode = current as Text;
    const parent = textNode.parentElement;
    if (
      parent &&
      !parent.closest('pre, code') &&
      /\+\+[^+\n]+\+\+/.test(textNode.data)
    ) {
      candidates.push(textNode);
    }
    current = walker.nextNode();
  }

  candidates.forEach((textNode) => {
    const fragment = doc.createDocumentFragment();
    const pattern = /\+\+([^+\n]+)\+\+/g;
    let cursor = 0;
    let match = pattern.exec(textNode.data);

    while (match) {
      if (match.index > cursor) {
        fragment.appendChild(doc.createTextNode(textNode.data.slice(cursor, match.index)));
      }
      const underline = doc.createElement('u');
      underline.textContent = match[1];
      fragment.appendChild(underline);
      cursor = match.index + match[0].length;
      match = pattern.exec(textNode.data);
    }

    if (cursor < textNode.data.length) {
      fragment.appendChild(doc.createTextNode(textNode.data.slice(cursor)));
    }

    textNode.parentNode?.replaceChild(fragment, textNode);
  });
}

function transformNotes(doc: Document): void {
  doc.querySelectorAll('p').forEach((paragraph) => {
    if (!paragraph.textContent?.trimStart().startsWith('!>')) return;

    const walker = doc.createTreeWalker(paragraph, NodeFilter.SHOW_TEXT);
    let current = walker.nextNode();
    while (current) {
      const textNode = current as Text;
      if (textNode.data.trim()) {
        textNode.data = textNode.data.replace(/^\s*!>\s*/, '');
        break;
      }
      current = walker.nextNode();
    }
    paragraph.setAttribute('data-mdflow-role', 'note');
  });
}

function isOpeningQuote(blockquote: Element): boolean {
  let sibling = blockquote.previousElementSibling;
  while (sibling) {
    if (!/^h1$/i.test(sibling.tagName)) return false;
    sibling = sibling.previousElementSibling;
  }
  return true;
}

function isMeaningfulImageCaption(alt: string): boolean {
  const normalized = alt.trim();
  if (!normalized) return false;
  if (/\.(?:avif|gif|jpe?g|png|svg|webp)$/i.test(normalized)) return false;
  if (/^(?:pasted image|image)[-_ ]?\d*/i.test(normalized)) return false;
  return true;
}

function decorateStructure(doc: Document, theme: Theme): void {
  const enhanced = theme.enhanced;
  if (!enhanced) return;

  doc.querySelectorAll('h2').forEach((heading, index) => {
    const badge = doc.createElement('span');
    badge.setAttribute('style', enhanced.h2Number);
    badge.textContent = String(index + 1).padStart(2, '0');
    heading.insertBefore(badge, heading.firstChild);
  });

  doc.querySelectorAll('blockquote').forEach((blockquote) => {
    if (isOpeningQuote(blockquote)) {
      blockquote.setAttribute('style', enhanced.openingQuote);
    }
  });

  doc.querySelectorAll('mark').forEach((mark) => {
    mark.setAttribute('style', enhanced.highlight);
  });

  doc.querySelectorAll('u').forEach((underline) => {
    underline.setAttribute('style', enhanced.underline);
  });

  doc.querySelectorAll('[data-mdflow-role="note"]').forEach((note) => {
    note.setAttribute('style', enhanced.note);
  });

  doc.querySelectorAll('del, s').forEach((deleted) => {
    appendStyle(deleted, 'color:#9CA3AF;text-decoration:line-through;');
  });

  doc.querySelectorAll('tbody tr:nth-child(even)').forEach((row) => {
    appendStyle(row, `background:${enhanced.accentSoft};`);
  });

  const images = Array.from(doc.querySelectorAll('img'));
  images.forEach((image) => {
    const alt = image.getAttribute('alt')?.trim();
    if (!alt || !isMeaningfulImageCaption(alt)) return;

    const caption = doc.createElement('p');
    caption.setAttribute('style', enhanced.caption);
    caption.textContent = alt;

    const imageBlock = image.parentElement?.tagName.toLowerCase() === 'p'
      ? image.parentElement
      : image;
    imageBlock.parentNode?.insertBefore(caption, imageBlock.nextSibling);
  });

  doc.querySelectorAll('hr').forEach((divider) => {
    const section = doc.createElement('section');
    section.setAttribute('style', enhanced.divider);
    const placeholder = doc.createElement('span');
    placeholder.setAttribute('leaf', '');
    placeholder.appendChild(doc.createElement('br'));
    section.appendChild(placeholder);
    divider.parentNode?.replaceChild(section, divider);
  });
}

export function renderEnhancedTheme(html: string, theme: Theme): string {
  const doc = new DOMParser().parseFromString(html, 'text/html');

  transformPlusUnderlines(doc);
  transformNotes(doc);
  applySelectorStyles(doc, theme);
  decorateStructure(doc, theme);

  const container = doc.createElement('section');
  container.setAttribute('style', theme.styles.container);
  while (doc.body.firstChild) {
    container.appendChild(doc.body.firstChild);
  }

  return container.outerHTML;
}
