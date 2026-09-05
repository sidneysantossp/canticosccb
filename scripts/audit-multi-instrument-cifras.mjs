#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const INSTRUMENTS = new Map([
  ['Violão', 'violao'],
  ['Ukulele', 'ukulele'],
  ['Teclado', 'teclado'],
  ['Cavaco', 'cavaco'],
  ['Baixo', 'baixo'],
  ['Bateria', 'bateria'],
  ['Gaita', 'gaita'],
  ['Viola', 'viola'],
]);

function normalize(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\b(hino|hinario|ccb)\b/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseArgs(argv) {
  const args = { base: '', output: '' };
  for (let index = 0; index < argv.length; index += 1) {
    const key = argv[index];
    if (!key.startsWith('--')) continue;
    args[key.slice(2)] = argv[index + 1] || '';
    index += 1;
  }
  return args;
}

function parseReferenceFile(filePath, instrument) {
  const raw = readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');
  const titleMatch = raw.match(/^MÚSICA:\s*(.+?)(?:\s*\([^)]*\))?\s*$/m);
  const keyMatch = raw.match(/^TOM:\s*(.+?)\s*$/m);
  const frames = [...raw.matchAll(/^={20,}\s*$/gm)];
  const footer = raw.search(/^[-]{20,}\s*$/m);
  const bodyStart = frames[1] ? frames[1].index + frames[1][0].length : 0;
  const bodyEnd = footer >= 0 ? footer : raw.length;
  const body = raw.slice(bodyStart, bodyEnd).trim();
  const sourceTitle = titleMatch?.[1]?.trim() || '';
  const numberedTitle = sourceTitle.match(/^(?:HINO\s*)?(0*\d{1,3})\s*(?:[-–—.:]\s*|\s{2,})(.+)$/i);
  const number = numberedTitle ? Number(numberedTitle[1]) : null;
  const title = numberedTitle?.[2]?.trim() || sourceTitle;

  return {
    file: filePath,
    instrument,
    number,
    title,
    key: keyMatch?.[1]?.trim() || '',
    body,
    lines: body ? body.split('\n').filter(Boolean).length : 0,
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const base = resolve(args.base || 'C:/Users/si_d1/Downloads/cifras_multi_instrumento_2026-09-03');
  if (!existsSync(base)) throw new Error(`Base não encontrada: ${base}`);

  const entries = [];
  for (const [folder, instrument] of INSTRUMENTS) {
    const directory = join(base, folder);
    if (!existsSync(directory)) continue;
    for (const file of readdirSync(directory, { withFileTypes: true })) {
      if (!file.isFile() || !file.name.toLowerCase().endsWith('.txt')) continue;
      entries.push(parseReferenceFile(join(directory, file.name), instrument));
    }
  }

  const groups = new Map();
  for (const entry of entries) {
    const id = `${entry.number || 'sem-numero'}|${normalize(entry.title)}`;
    if (!groups.has(id)) groups.set(id, { number: entry.number, title: entry.title, files: [] });
    groups.get(id).files.push(entry);
  }

  const grouped = [...groups.values()].map((group) => {
    const byInstrument = Object.fromEntries([...INSTRUMENTS.values()].map((instrument) => [instrument, 0]));
    const keys = new Set();
    const bodies = new Set();
    for (const item of group.files) {
      byInstrument[item.instrument] += 1;
      if (item.key) keys.add(item.key);
      if (item.body) bodies.add(item.body);
    }
    return {
      number: group.number,
      title: group.title,
      files: group.files.length,
      byInstrument,
      keys: [...keys].sort(),
      distinctBodies: bodies.size,
      isComplete: Object.values(byInstrument).every((count) => count === 6),
    };
  });

  const result = {
    generatedAt: new Date().toISOString(),
    base,
    instruments: [...INSTRUMENTS.values()],
    totalFiles: entries.length,
    parsedFiles: entries.filter((entry) => entry.title && entry.body).length,
    distinctSongs: grouped.length,
    validHinarioNumbers: grouped.filter((item) => item.number && item.number >= 1 && item.number <= 480).length,
    completeEightInstrumentSets: grouped.filter((item) => item.isComplete).length,
    sameBodyAcrossAllVariants: grouped.filter((item) => item.distinctBodies === 6).length,
    incomplete: grouped.filter((item) => !item.isComplete || item.distinctBodies !== 6),
    songs: grouped.sort((left, right) => (left.number || 9999) - (right.number || 9999) || left.title.localeCompare(right.title, 'pt-BR')),
  };

  console.log(JSON.stringify({
    totalFiles: result.totalFiles,
    parsedFiles: result.parsedFiles,
    distinctSongs: result.distinctSongs,
    validHinarioNumbers: result.validHinarioNumbers,
    completeEightInstrumentSets: result.completeEightInstrumentSets,
    sameBodyAcrossAllVariants: result.sameBodyAcrossAllVariants,
    incomplete: result.incomplete.length,
  }, null, 2));

  if (args.output) {
    writeFileSync(resolve(args.output), `${JSON.stringify(result, null, 2)}\n`);
    console.log(`Auditoria salva em ${resolve(args.output)}`);
  }
}

main();
