#!/usr/bin/env node
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const DEFAULT_PDF = '/Users/trabalho/Downloads/Hinario-5-ccb-para-violao-altura-padrao.pdf';
const DEFAULT_OUT = 'tmp/hinario-cifras/hinario-cifras.json';
const DEFAULT_WORKDIR = 'tmp/hinario-cifras/pages';

const CHORD_RE = /^[A-G](?:#|b)?(?:m|maj|min|dim|aug|sus|add)?(?:\d+)?(?:\/[A-G](?:#|b)?)?[*º°+()-]*$/;
const CHORD_TOKEN_RE = /[A-G](?:#|b)?(?:maj|min|dim|aug|sus|add|m)?\d*(?:\/[A-G](?:#|b)?)?[*º°+]?/y;

function parseArgs(argv) {
  const args = {
    pdf: DEFAULT_PDF,
    from: 3,
    to: 7,
    out: DEFAULT_OUT,
    workdir: DEFAULT_WORKDIR,
    catalog: 'src/data/publicCatalogSnapshot.json',
    dpi: 200,
    lang: 'por+eng',
    psm: 6,
    jobs: 1,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith('--')) continue;
    const key = arg.slice(2);
    const value = argv[index + 1];
    if (value === undefined || value.startsWith('--')) {
      args[key] = true;
      continue;
    }
    args[key] = value;
    index += 1;
  }

  args.from = Number(args.from);
  args.to = Number(args.to);
  args.dpi = Number(args.dpi);
  args.psm = Number(args.psm);
  args.jobs = Math.max(1, Number(args.jobs || 1));

  return args;
}

function runAsync(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      ...options,
    });

    let stdout = '';
    let stderr = '';
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk) => {
      stdout += chunk;
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`${command} ${args.join(' ')} failed:\n${stderr || stdout}`));
        return;
      }
      resolve(stdout);
    });
  });
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 30,
    ...options,
  });

  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed:\n${result.stderr || result.stdout}`);
  }

  return result.stdout;
}

function resolvePdftoppm() {
  const bundled = '/Users/trabalho/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/override/pdftoppm';
  if (existsSync(bundled)) return bundled;
  return 'pdftoppm';
}

function renderPage(pdf, page, workdir, dpi) {
  mkdirSync(workdir, { recursive: true });
  const prefix = path.join(workdir, `page-${String(page).padStart(3, '0')}`);
  const imagePath = `${prefix}.png`;
  if (existsSync(imagePath)) return imagePath;

  run(resolvePdftoppm(), [
    '-png',
    '-singlefile',
    '-f',
    String(page),
    '-l',
    String(page),
    '-r',
    String(dpi),
    pdf,
    prefix,
  ]);

  if (!existsSync(imagePath)) {
    throw new Error(`pdftoppm did not create ${imagePath}`);
  }

  return imagePath;
}

async function renderPageAsync(pdf, page, workdir, dpi) {
  mkdirSync(workdir, { recursive: true });
  const prefix = path.join(workdir, `page-${String(page).padStart(3, '0')}`);
  const imagePath = `${prefix}.png`;
  if (existsSync(imagePath)) return imagePath;

  await runAsync(resolvePdftoppm(), [
    '-png',
    '-singlefile',
    '-f',
    String(page),
    '-l',
    String(page),
    '-r',
    String(dpi),
    pdf,
    prefix,
  ]);

  if (!existsSync(imagePath)) {
    throw new Error(`pdftoppm did not create ${imagePath}`);
  }

  return imagePath;
}

function ocrTsv(imagePath, lang, psm) {
  return run('tesseract', [
    imagePath,
    'stdout',
    '-l',
    lang,
    '--psm',
    String(psm),
    'tsv',
  ]);
}

async function ocrTsvAsync(imagePath, lang, psm) {
  return runAsync('tesseract', [
    imagePath,
    'stdout',
    '-l',
    lang,
    '--psm',
    String(psm),
    'tsv',
  ]);
}

function parseTsv(tsv) {
  const rows = tsv.trim().split('\n');
  const header = rows.shift()?.split('\t') ?? [];
  return rows
    .map((row) => {
      const cells = row.split('\t');
      const item = Object.fromEntries(header.map((key, index) => [key, cells[index] ?? '']));
      return {
        level: Number(item.level),
        block: Number(item.block_num),
        paragraph: Number(item.par_num),
        line: Number(item.line_num),
        word: Number(item.word_num),
        left: Number(item.left),
        top: Number(item.top),
        width: Number(item.width),
        height: Number(item.height),
        conf: Number(item.conf),
        text: String(item.text ?? '').trim(),
      };
    })
    .filter((row) => Number.isFinite(row.left) && Number.isFinite(row.top));
}

function normalizeText(text) {
  return String(text || '')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[–—]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

function slugify(value) {
  return normalizeText(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function loadCatalogTitles(catalogPath) {
  if (!catalogPath || !existsSync(catalogPath)) return new Map();
  const data = JSON.parse(readFileSync(catalogPath, 'utf8'));
  const rows = Array.isArray(data.hymns) ? data.hymns : [];
  const titles = new Map();
  for (const row of rows) {
    const number = Number(row.numero);
    const title = normalizeText(row.titulo || '');
    if (!Number.isFinite(number) || !title || titles.has(number)) continue;
    titles.set(number, title);
  }
  return titles;
}

function applyCatalogTitles(items, titles) {
  if (!titles.size) return items;
  return items.map((item) => {
    const number = Number(item.hinario_numero);
    if (!Number.isFinite(number) || number <= 0) return item;
    const catalogTitle = titles.get(number);
    if (!catalogTitle) return item;
    const canonicalSlug = `hino-${item.hinario_numero}-${slugify(catalogTitle)}`;
    return {
      ...item,
      title: catalogTitle,
      canonical_slug: canonicalSlug,
      public_slug: `${canonicalSlug}-violao`,
      metadata: {
        ...(item.metadata || {}),
        ocr_title: item.title,
      },
    };
  });
}

function groupWordsIntoLines(words, region) {
  const grouped = new Map();
  for (const word of words) {
    const key = `${region}:${word.block}:${word.paragraph}:${word.line}`;
    const current = grouped.get(key) ?? [];
    current.push(word);
    grouped.set(key, current);
  }

  return Array.from(grouped.values())
    .map((lineWords) => {
      const sorted = lineWords.sort((left, right) => left.left - right.left);
      return {
        top: Math.min(...sorted.map((word) => word.top)),
        left: Math.min(...sorted.map((word) => word.left)),
        text: normalizeText(sorted.map((word) => word.text).join(' ')),
      };
    })
    .filter((line) => line.text)
    .sort((left, right) => left.top - right.top || left.left - right.left);
}

function parseTitle(lines) {
  const titleLine = lines.find((line) => /hino\s*[-—]?\s*\d+/i.test(line.text));
  if (!titleLine) return null;

  const match = titleLine.text.match(/hino\s*[-—]?\s*(\d+)\s*[-—]?\s*(.+)$/i);
  if (!match) return null;

  return {
    number: Number(match[1]),
    title: normalizeText(match[2]).replace(/\s{2,}/g, ' '),
  };
}

function parseMetadata(lines) {
  const joined = lines.map((line) => line.text).join('\n');
  const key = joined.match(/Tonalidade:\s*([A-G](?:#|b)?m?)/i)?.[1] ?? null;
  const timeSignature = joined.match(/Compasso:\s*([0-9]+\/[0-9]+)/i)?.[1] ?? null;
  const bpmMatch = joined.match(/BPM\s*[-–—]\s*(\d+)(?:\s*[-–—]\s*(\d+))?/i);
  const tempoBpm = bpmMatch ? Number(bpmMatch[1]) : null;
  const tempoBpmMax = bpmMatch?.[2] ? Number(bpmMatch[2]) : null;
  const rhythm = joined.match(/Ritmo no viol[aã]o:\s*(.+?)(?:\n|BPM|$)/i)?.[1] ?? null;

  return {
    originalKey: key,
    timeSignature,
    tempoBpm,
    tempoBpmMax,
    rhythm: rhythm ? normalizeText(rhythm) : null,
  };
}

function isChordLine(text) {
  const tokens = normalizeText(text).split(/\s+/).filter(Boolean);
  if (!tokens.length) return false;
  return tokens.every((token) => CHORD_RE.test(token));
}

function splitChordCluster(token) {
  const clean = token.replace(/[,:;]+$/g, '');
  if (clean === 'Cc') return ['C'];
  if (CHORD_RE.test(clean)) return [clean];
  if (!/^[A-G][A-G#bmmajindugs0-9/º°+*()-]+$/.test(clean)) return [token];

  const parts = [];
  let index = 0;
  while (index < clean.length) {
    CHORD_TOKEN_RE.lastIndex = index;
    const match = CHORD_TOKEN_RE.exec(clean);
    if (!match || match.index !== index || !match[0]) return [token];
    parts.push(match[0]);
    index = CHORD_TOKEN_RE.lastIndex;
  }

  return parts.length > 1 && parts.every((part) => CHORD_RE.test(part)) ? parts : [token];
}

function normalizePotentialChordLine(line) {
  const tokens = normalizeText(line).split(/\s+/).filter(Boolean);
  const expanded = tokens.flatMap(splitChordCluster);
  return expanded.length > 0 && expanded.every((token) => CHORD_RE.test(token))
    ? expanded.join(' ')
    : normalizeText(line);
}

function extractChords(lines) {
  const chords = new Set();
  for (const line of lines) {
    for (const token of line.split(/\s+/)) {
      const clean = token.replace(/[,:;]+$/g, '');
      if (CHORD_RE.test(clean)) chords.add(clean);
    }
  }
  return Array.from(chords).sort();
}

function parsePage(page, rows) {
  const pageRow = rows.find((row) => row.level === 1);
  const pageWidth = pageRow?.width || 1654;
  const pageHeight = pageRow?.height || 2339;
  const words = rows.filter((row) => row.level === 5 && row.text && row.conf >= 20);

  const allLines = groupWordsIntoLines(words, 'all');
  const isCompactHeaderLayout = allLines
    .slice(0, 4)
    .some((line) => /APOSTILA CCB\s*-\s*HIN[ÁA]RIO/i.test(line.text));
  const titleLines = groupWordsIntoLines(
    words.filter((word) => word.left < pageWidth * 0.72 && word.top > pageHeight * 0.04 && word.top < pageHeight * 0.23),
    'title',
  );
  const title = parseTitle(titleLines) || parseTitle(allLines);
  const metadata = parseMetadata(allLines);

  const footerY = pageHeight * 0.93;
  const bodyStartY = pageHeight * (isCompactHeaderLayout ? 0.22 : 0.31);
  const rightColumnEndY = pageHeight * (isCompactHeaderLayout ? 0.43 : 0.27);
  const leftWords = words.filter((word) =>
    word.left < pageWidth * 0.53 &&
    word.top > bodyStartY &&
    word.top < footerY &&
    !/^APOSTILA$/i.test(word.text),
  );
  const rightWords = words.filter((word) =>
    word.left > pageWidth * 0.55 &&
    word.top > pageHeight * 0.06 &&
    word.top < rightColumnEndY,
  );

  const leftLines = groupWordsIntoLines(leftWords, 'left');
  const rightLines = groupWordsIntoLines(rightWords, 'right');
  const bodyLines = [...leftLines, ...rightLines]
    .map((line) => normalizePotentialChordLine(line.text))
    .filter((line) =>
      line &&
      !/^Hino\s+\d+/i.test(line) &&
      !/^Tonalidade:/i.test(line) &&
      !/^Compasso:/i.test(line) &&
      !/^Ritmo/i.test(line) &&
      !/^BPM/i.test(line) &&
      !/^HIN[ÁA]RIO/i.test(line) &&
      !/^Hinos Cifrados/i.test(line),
    );

  const warnings = [];
  if (!title) warnings.push('title_not_found');
  if (!metadata.originalKey) warnings.push('original_key_not_found');
  if (bodyLines.length < 8) warnings.push('few_body_lines');

  const sectionLines = bodyLines.map((line) => ({
    type: isChordLine(line) ? 'chord_line' : 'lyric',
    text: line,
  }));

  const plainText = bodyLines.join('\n').trim();
  const fallbackTitle = title?.title || `Hino ${page}`;
  const number = title?.number ?? null;
  const canonicalSlug = number
    ? `hino-${number}-${slugify(fallbackTitle)}`
    : `hinario-page-${page}-${slugify(fallbackTitle)}`;

  return {
    page,
    hinario_numero: number,
    title: fallbackTitle,
    canonical_slug: canonicalSlug,
    public_slug: `${canonicalSlug}-violao`,
    source_type: 'hinario',
    instrument: 'violao',
    arrangement_type: 'completa',
    difficulty_level: 'intermediario',
    tuning: 'standard',
    capo: 0,
    original_key: metadata.originalKey || 'C',
    preferred_key: metadata.originalKey || null,
    tempo_bpm: metadata.tempoBpm,
    time_signature: metadata.timeSignature,
    intro_notes: [
      metadata.rhythm ? `Ritmo no violao: ${metadata.rhythm}` : null,
      metadata.tempoBpmMax ? `BPM sugerido: ${metadata.tempoBpm}-${metadata.tempoBpmMax}` : null,
    ].filter(Boolean).join(' | ') || null,
    body_text: plainText,
    body_ast: {
      sections: [
        {
          key: 'verse',
          label: 'Hino',
          order: 1,
          cueStartSeconds: null,
          cueEndSeconds: null,
          loopStartSeconds: null,
          loopEndSeconds: null,
          lines: sectionLines,
        },
      ],
    },
    sections: [
      {
        section_order: 1,
        section_key: 'verse',
        section_label: 'Hino',
        content_ast: sectionLines,
        plain_text: plainText,
        chords_index: extractChords(bodyLines),
      },
    ],
    chords_index: extractChords(bodyLines),
    lines_count: bodyLines.filter(Boolean).length,
    warnings,
    ocr: {
      dpi: null,
      confidence_hint: Math.round(words.reduce((sum, word) => sum + Math.max(0, word.conf), 0) / Math.max(1, words.length)),
    },
  };
}

async function processPage(args, page) {
  console.log(`OCR page ${page}...`);
  const imagePath = await renderPageAsync(args.pdf, page, args.workdir, args.dpi);
  const tsv = await ocrTsvAsync(imagePath, args.lang, args.psm);
  const rows = parseTsv(tsv);
  const item = parsePage(page, rows);
  item.ocr.dpi = args.dpi;
  return item;
}

async function processPages(args) {
  if (args.jobs <= 1) {
    const items = [];
    for (let page = args.from; page <= args.to; page += 1) {
      console.log(`OCR page ${page}...`);
      const imagePath = renderPage(args.pdf, page, args.workdir, args.dpi);
      const tsv = ocrTsv(imagePath, args.lang, args.psm);
      const rows = parseTsv(tsv);
      const item = parsePage(page, rows);
      item.ocr.dpi = args.dpi;
      items.push(item);
    }
    return items;
  }

  const pages = Array.from({ length: args.to - args.from + 1 }, (_, index) => args.from + index);
  const results = new Map();
  let cursor = 0;

  async function worker() {
    while (cursor < pages.length) {
      const page = pages[cursor];
      cursor += 1;
      const item = await processPage(args, page);
      results.set(page, item);
    }
  }

  await Promise.all(Array.from({ length: args.jobs }, () => worker()));
  return pages.map((page) => results.get(page)).filter(Boolean);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!existsSync(args.pdf)) {
    throw new Error(`PDF not found: ${args.pdf}`);
  }

  mkdirSync(path.dirname(args.out), { recursive: true });
  mkdirSync(args.workdir, { recursive: true });

  const catalogTitles = loadCatalogTitles(args.catalog);
  const items = applyCatalogTitles(await processPages(args), catalogTitles);

  const payload = {
    source_pdf: args.pdf,
    generated_at: new Date().toISOString(),
    range: { from: args.from, to: args.to },
    count: items.length,
    items,
  };

  writeFileSync(args.out, `${JSON.stringify(payload, null, 2)}\n`);
  console.log(`Wrote ${items.length} item(s) to ${args.out}`);
  const warnings = items.flatMap((item) => item.warnings.map((warning) => `${item.page}:${warning}`));
  if (warnings.length) {
    console.warn(`Warnings: ${warnings.join(', ')}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
