#!/usr/bin/env node

const fs   = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT         = path.resolve(__dirname, '../..');
const buildScript  = path.join(__dirname, 'build.js');

const KNOWN_SHEETS = ['score', 'yakus', 'initiation', 'ruler'];

console.log('Watching sources for changes…');
console.log('Press Ctrl+C to stop.\n');

const debounceTimers = {};

function rebuild(sheet, lang = '') {
  const t0 = Date.now();
  try {
    const out = execSync(
      `node "${buildScript}" --sheet ${sheet} ${lang ? `--lang ${lang}` : ''} --format html`,
      { cwd: ROOT, encoding: 'utf8' }
    );
    process.stdout.write(out);
    console.log(`[${sheet}] rebuilt in ${Date.now() - t0}ms`);
  } catch (err) {
    console.error(`[${sheet}] build failed:\n${err.stderr || err.message}`);
  }
}

fs.watch(ROOT, { recursive: true }, (_eventType, filename) => {
  if (!filename) return;

  if (!(filename.includes('i18n') || filename.includes('src/sheets'))) return;

  const ext   = path.extname(filename);
  const sheet = path.basename(filename, ext);

  if ((ext !== '.html' && ext !== '.css' && ext !== '.po') || !KNOWN_SHEETS.includes(sheet)) return;

  let lang = '';
  if (filename.includes('i18n')) {
    lang = path.basename(path.dirname(filename));
  }

  // Debounce: editors often fire multiple events on a single save
  clearTimeout(debounceTimers[sheet]);
  debounceTimers[sheet] = setTimeout(() => rebuild(sheet, lang), 150);
});
