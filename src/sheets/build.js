#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { parseArgs } = require('node:util');
const { loadTranslations } = require('./parse-po');
const { render } = require('./renderer');

const { values: cliArgs } = parseArgs({
  options: {
    sheet:   { type: 'string',  short: 's' },
    lang:    { type: 'string',  short: 'l' },
    format:  { type: 'string',  short: 'f' },
  },
});

const ROOT      = path.resolve(__dirname, '../..');
const i18nDir   = path.join(ROOT, 'i18n');

const VALID_SHEETS = ['score', 'yakus', 'initiation', 'ruler'];
const VALID_FORMATS = ['html', 'pdf', 'jpg'];

function resolveSheets(sheet) {
  if (sheet) {
    if (!VALID_SHEETS.includes(sheet)) {
      throw new Error(`Invalid sheet "${sheet}". Valid: ${VALID_SHEETS.join(', ')}`);
    }
    return [sheet];
  }
  return VALID_SHEETS;
}

function resolveFormats(format) {
  if (format) {
    if (!VALID_FORMATS.includes(format)) {
      throw new Error(`Invalid format "${format}". Valid: ${VALID_FORMATS.join(', ')}`);
    }
    return [format];
  }
  return VALID_FORMATS;
}

function resolveLangs(sheet, lang) {
  if (lang) {
    return [lang];
  }

  const langs = fs.readdirSync(i18nDir, { withFileTypes: true })
    .filter(e => e.isDirectory() && fs.existsSync(path.join(i18nDir, e.name, `${sheet}.po`)))
    .map(e => e.name);

  if (langs.length === 0) {
    console.warn(`No i18n/*/${sheet}.po files found — building English template.`);
    return ['en'];
  }

  return langs;
}

async function run({ sheet, lang, formats }) {
  const sheets = resolveSheets(sheet);
  const resolvedFormats = formats ?? resolveFormats();

  for (const sheetName of sheets) {
    const langs = resolveLangs(sheetName, lang);
    for (const langName of langs) {
      await buildSheet(sheetName, langName, resolvedFormats);
    }
  }
}

if (require.main === module) {
  run({ sheet: cliArgs.sheet, lang: cliArgs.lang, formats: resolveFormats(cliArgs.format) })
    .catch(err => {
      console.error(err.message);
      process.exit(1);
    });
}


async function buildSheet(sheet, lang, formats) {
  const templatePath = path.join(ROOT, 'src/sheets/templates', `${sheet}.html`);
  const outputDir    = path.join(ROOT, 'dist/sheets');

  let html = fs.readFileSync(templatePath, 'utf8');

  html = html.replaceAll('__meta.url__', 'https://zes.sx/riichi');
  html = html.replaceAll('__meta.date__', new Date().toISOString().substring(0, 7));

  // Absolutize paths
  const imagesDir = path.join(ROOT, 'src/sheets/images');
  const stylesDir = path.join(ROOT, 'src/sheets/css');
  html = html.replaceAll('__path.images__', `file://${imagesDir}`);
  html = html.replaceAll('__path.styles__', `file://${stylesDir}`);

  // Language CSS override
  const cssOverride = path.join(i18nDir, lang, `${sheet}.css`);
  if (fs.existsSync(cssOverride)) {
    html = html.replace(
      '</head>',
      `  <link rel="stylesheet" href="file://${cssOverride}">\n</head>`
    );
  }

  // Translations
  const poPath = path.join(i18nDir, lang, `${sheet}.po`);
  let translations = {}
  if (fs.existsSync(poPath)) {
    translations = loadTranslations(poPath);
    for (const [msgid, msgstr] of Object.entries(translations)) {
      html = html.replaceAll(`__${msgid}__`, msgstr);
    }
  } else if (lang !== 'en') {
    throw new Error(`Error: no i18n/${lang}/${sheet}.po found`);
  }

  fs.mkdirSync(outputDir, { recursive: true });

  const name         = `${sheet}-v${translations['meta.version']}-${translations['meta.language']}`;
  const htmlOut       = path.join(outputDir, `${name}.html`);
  const outputBase    = path.join(outputDir, name);
  const needPuppeteer = formats.includes('pdf') || formats.includes('jpg');

  if (formats.includes('html') || needPuppeteer) {
    fs.writeFileSync(htmlOut, html, 'utf8');
    if (formats.includes('html')) console.log(`[${sheet}/${lang}] HTML → ${htmlOut}`);
  }

  if (needPuppeteer) {
    await render(htmlOut, outputBase, sheet, formats);
    if (formats.includes('pdf')) console.log(`[${sheet}/${lang}] PDF  → ${outputBase}.pdf`);
    if (formats.includes('jpg')) console.log(`[${sheet}/${lang}] JPG  → ${outputBase}.jpg`);

    if (!formats.includes('html')) fs.unlinkSync(htmlOut);
  }
}

module.exports = {
  run,
  VALID_SHEETS,
  VALID_FORMATS,
};
