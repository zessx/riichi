#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { parseArgs } = require('node:util');
const { VALID_FORMATS } = require('./build');

const ROOT = path.resolve(__dirname, '../..');
const outputDir = path.join(ROOT, 'dist/sheets');
const publishDir = path.join(ROOT, 'src/website/doc');
const VALID_PUBLISH_FORMATS = ['pdf', 'jpg'];

const { values: args } = parseArgs({
  options: {
    sheet:   { type: 'string', short: 's' },
    lang:    { type: 'string', short: 'l' },
    format:  { type: 'string', short: 'f' },
  },
});

function resolveFormats(format) {
  if (!format) {
    return VALID_PUBLISH_FORMATS;
  }

  if (!VALID_FORMATS.includes(format)) {
    throw new Error(`Invalid format "${format}". Valid: ${VALID_FORMATS.join(', ')}`);
  }

  if (!VALID_PUBLISH_FORMATS.includes(format)) {
    throw new Error(`sheet:publish only supports ${VALID_PUBLISH_FORMATS.join(' and ')}.
Use sheet:build if you need HTML output.`);
  }

  return [format];
}

function getPublishedFiles({ sheet, lang, formats }) {
  return fs.readdirSync(outputDir, { withFileTypes: true })
    .filter(entry => entry.isFile())
    .map(entry => entry.name)
    .filter(file => {
      const extension = path.extname(file).slice(1);
      if (!formats.includes(extension)) {
        return false;
      }
      if (sheet && !file.startsWith(`${sheet}-`)) {
        return false;
      }
      if (lang && !file.endsWith(`-${lang}.${extension}`)) {
        return false;
      }
      return true;
    });
}

function copyFiles(files) {
  fs.mkdirSync(publishDir, { recursive: true });

  for (const file of files) {
    const source = path.join(outputDir, file);
    const destination = path.join(publishDir, file);
    fs.copyFileSync(source, destination);
    console.log(`[publish] ${file} → ${destination}`);
  }
}

async function publish() {
  const formats = resolveFormats(args.format);

  const files = getPublishedFiles({ sheet: args.sheet, lang: args.lang, formats });
  if (files.length === 0) {
    console.warn('No files were published. Check the sheet and language arguments, or make sure builds produced PDF/JPG outputs.');
    process.exit(0);
  }

  copyFiles(files);
}

if (require.main === module) {
  publish().catch(err => {
    console.error(err.message);
    process.exit(1);
  });
}
