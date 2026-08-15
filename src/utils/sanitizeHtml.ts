const ALLOWED_TAGS = new Set([
  'P', 'BR', 'STRONG', 'B', 'EM', 'I', 'U', 'UL', 'OL', 'LI', 'SPAN', 'DIV', 'H1', 'H2', 'H3', 'A',
]);
const ALLOWED_ATTRIBUTES = new Set(['class', 'title', 'href', 'target', 'rel']);
const SAFE_PROTOCOLS = new Set(['http:', 'https:', 'mailto:']);

function isSafeUrl(value: string): boolean {
  const raw = String(value || '').trim();
  if (!raw || raw.startsWith('#') || raw.startsWith('/') || raw.startsWith('./')) return true;
  try {
    return SAFE_PROTOCOLS.has(new URL(raw, window.location.origin).protocol);
  } catch {
    return false;
  }
}

export function sanitizeHtml(input: string): string {
  if (!input) return '';
  if (typeof window === 'undefined' || typeof DOMParser === 'undefined') {
    return input.replace(/<[^>]*>/g, '');
  }

  const document = new DOMParser().parseFromString(String(input), 'text/html');
  const elements = Array.from(document.body.querySelectorAll('*'));
  for (const element of elements) {
    if (!ALLOWED_TAGS.has(element.tagName)) {
      if (element.tagName === 'SCRIPT' || element.tagName === 'STYLE' || element.tagName === 'IFRAME' || element.tagName === 'OBJECT') {
        element.remove();
      } else {
        element.replaceWith(document.createTextNode(element.textContent || ''));
      }
      continue;
    }

    for (const attribute of Array.from(element.attributes)) {
      const name = attribute.name.toLowerCase();
      if (name.startsWith('on') || !ALLOWED_ATTRIBUTES.has(name)) {
        element.removeAttribute(attribute.name);
        continue;
      }
      if ((name === 'href' || name === 'src') && !isSafeUrl(attribute.value)) {
        element.removeAttribute(attribute.name);
      }
    }
    if (element.tagName === 'A' && element.getAttribute('target') === '_blank') {
      element.setAttribute('rel', 'noopener noreferrer');
    }
  }
  return document.body.innerHTML;
}

export default sanitizeHtml;
