/*
 Minimal PoC scraper for ACF on bibliaonline.com.br
 Usage:
   node scripts/scrape_acf_example.js --slug=gn --chapter=1 [--out=tmp]
 Notes:
 - This is for demonstration only. Review the site's Terms of Use and obtain permission before large-scale scraping.
 - Selectors may need refinement if the DOM changes.
*/

import fs from 'node:fs';
import path from 'node:path';
import * as cheerio from 'cheerio';

function parseArgs() {
  const args = process.argv.slice(2);
  const out = {};
  for (const a of args) {
    const [k, v] = a.replace(/^--/, '').split('=');
    out[k] = v ?? true;
  }
  return out;
}

async function fetchHtml(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'CanticosCCB/1.0 (+https://canticosccb.com.br) demo-scraper',
      'Accept': 'text/html,application/xhtml+xml',
    },
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${url}`);
  }
  return await res.text();
}

function cleanText(s) {
  return (s || '')
    .replace(/\s+/g, ' ')
    .replace(/[\u00A0\t\r\n]+/g, ' ')
    .trim();
}

function trySelectors($) {
  // Strategy 1: elements with explicit data-verse attribute
  const verses1 = [];
  $('[data-verse]').each((_, el) => {
    const n = parseInt($(el).attr('data-verse'), 10);
    const text = cleanText($(el).text());
    if (Number.isFinite(n) && text) verses1.push({ number: n, text });
  });
  if (verses1.length > 0) return verses1;

  // Strategy 2: common class names
  const possible = ['.verse', '.versiculo', 'p.verse', 'span.verse'];
  for (const sel of possible) {
    const out = [];
    $(sel).each((_, el) => {
      // Extract number: look for leading sup or digits
      let n = null;
      const sup = $(el).find('sup').first();
      if (sup.length) {
        const maybe = parseInt(cleanText(sup.text()), 10);
        if (Number.isFinite(maybe)) n = maybe;
      }
      if (n == null) {
        const m = cleanText($(el).text()).match(/^(\d{1,3})\s+/);
        if (m) n = parseInt(m[1], 10);
      }
      const text = cleanText($(el).text().replace(/^\d{1,3}\s+/, ''));
      if (n && text) out.push({ number: n, text });
    });
    if (out.length > 0) return out;
  }

  // Strategy 3: reconstruct by traversing SUP markers
  const verses3 = [];
  const sups = $('sup').filter((_, el) => /^\d{1,3}$/.test(cleanText($(el).text())));
  sups.each((i, el) => {
    const n = parseInt(cleanText($(el).text()), 10);
    // collect siblings until next sup
    let txt = '';
    let node = el.nextSibling;
    while (node) {
      if (node.type === 'tag' && node.name === 'sup') break;
      const $node = $(node);
      const t = cleanText($node.text ? $node.text() : $node.data || '');
      if (t) txt += (txt ? ' ' : '') + t;
      node = node.nextSibling;
    }
    if (Number.isFinite(n) && txt) verses3.push({ number: n, text: cleanText(txt) });
  });
  return verses3;
}

function tryNextData($) {
  try {
    const raw = $('script#__NEXT_DATA__').first().html() || '';
    if (!raw) return null;
    const data = JSON.parse(raw);

    const results = [];

    function isVerseLike(obj) {
      if (!obj || typeof obj !== 'object') return false;
      const n = obj.number ?? obj.verse ?? obj.n ?? obj.index;
      const t = obj.text ?? obj.content ?? obj.t ?? obj.value;
      return (Number.isFinite(parseInt(n)) && typeof t === 'string' && t.trim().length > 0);
    }

    function visit(node) {
      if (!node) return;
      if (Array.isArray(node)) {
        // Is this an array of verses?
        if (node.length > 0 && node.every(isVerseLike)) {
          for (const v of node) {
            const number = parseInt(v.number ?? v.verse ?? v.n ?? v.index);
            const text = cleanText(String(v.text ?? v.content ?? v.t ?? v.value));
            if (Number.isFinite(number) && text) results.push({ number, text });
          }
          return; // found a candidate list
        }
        // Otherwise scan children
        for (const child of node) visit(child);
        return;
      }
      if (typeof node === 'object') {
        for (const k of Object.keys(node)) visit(node[k]);
      }
    }

    visit(data);
    return results.length ? results : null;
  } catch (e) {
    console.warn('Failed to parse __NEXT_DATA__:', e.message);
    return null;
  }
}

async function main() {
  const { slug = 'gn', chapter = '1', out = 'tmp' } = parseArgs();
  const url = `https://www.bibliaonline.com.br/acf/${slug}/${chapter}`;
  console.log('Fetching:', url);

  const html = await fetchHtml(url);
  const $ = cheerio.load(html);

  // Attempt to extract the book name and chapter title if available
  const title = cleanText($('h1, h2, .title, .capitulo, .chapter-title').first().text()) || `${slug.toUpperCase()} ${chapter}`;
  let verses = trySelectors($);
  if (!verses || verses.length === 0) {
    const nextDataVerses = tryNextData($);
    if (nextDataVerses && nextDataVerses.length) {
      verses = nextDataVerses;
    } else {
      // Try Next.js data endpoint using buildId
      try {
        const raw = $('script#__NEXT_DATA__').first().html() || '';
        if (raw) {
          const next = JSON.parse(raw);
          const buildId = next?.buildId;
          if (buildId) {
            const dataUrl = `https://www.bibliaonline.com.br/_next/data/${buildId}/acf/${slug}/${chapter}.json`;
            console.log('Fetching next data:', dataUrl);
            const res = await fetch(dataUrl, {
              headers: {
                'User-Agent': 'CanticosCCB/1.0 (+https://canticosccb.com.br) demo-scraper',
                'Accept': 'application/json',
              },
            });
            if (res.ok) {
              const json = await res.json();
              const probe = tryNextData({
                // shim: wrap a minimal cheerio-like to reuse tryNextData
                first() { return { html: () => JSON.stringify(json) }; }
              });
              if (probe && probe.length) {
                verses = probe;
              }
            } else {
              console.warn('Next data fetch failed:', res.status);
            }
          }
        }
      } catch (e) {
        console.warn('Next data endpoint parsing failed:', e.message);
      }
      verses = verses || [];
    }
  }

  console.log('Parsed:', { title, versesCount: verses.length });
  console.log('First verses preview:', verses.slice(0, 5));

  // Persist to JSON for inspection
  const dir = path.join(process.cwd(), out, 'bible', 'acf', slug);
  fs.mkdirSync(dir, { recursive: true });
  const outFile = path.join(dir, `${chapter}.json`);
  fs.writeFileSync(outFile, JSON.stringify({ translation: 'acf', slug, chapter: Number(chapter), title, verses }, null, 2), 'utf8');
  console.log('Saved to:', outFile);
}

// Node 18+: fetch is global. If not available, abort with helpful message.
if (typeof fetch !== 'function') {
  console.error('This script requires Node 18+ (global fetch). Please update Node or install node-fetch.');
  process.exit(1);
}

main().catch((err) => {
  console.error('Scrape failed:', err);
  process.exit(1);
});
