const fs = require('fs');
const gettextParser = require('gettext-parser');

/**
 * Load a .po file and return a map of { msgid: msgstr }.
 * Entries with empty msgstr are omitted (falls back to source English).
 */
function loadTranslations(poPath) {
  const content = fs.readFileSync(poPath);
  const po = gettextParser.po.parse(content);
  const map = {};

  if (!po.headers || !po.headers['Project-Id-Version']) {
    throw new Error(`Invalid .po file: missing "Project-Id-Version" header (${poPath})`);
  }
  if (!po.headers || !po.headers['Last-Translator']) {
    throw new Error(`Invalid .po file: missing "Last-Translator" header (${poPath})`);
  }
  if (!po.headers || !po.headers['Language']) {
    throw new Error(`Invalid .po file: missing "Language" header (${poPath})`);
  }

  map['meta.version'] = po.headers['Project-Id-Version'].split(' ')[1];
  map['meta.language'] = po.headers['Language'];
  map['meta.translator'] = po.headers['Last-Translator'];

  for (const msgctxt of Object.keys(po.translations)) {
    if (msgctxt == 'meta') continue; // skip meta context

    const entries = po.translations[msgctxt] ?? {};
    const prefix = msgctxt ? `${msgctxt}.` : '';
    for (const msgid of Object.keys(entries)) {
      if (!msgid) continue; // skip PO header entry
      const msgstr = entries[msgid].msgstr[0];
      if (msgstr) map[`${prefix}${msgid}`] = msgstr;
    }
  }
  return map;
}

module.exports = { loadTranslations };
