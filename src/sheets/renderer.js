const puppeteer = require('puppeteer');
const path = require('path');

/**
 * Render an HTML file to the requested formats using Puppeteer.
 * @param {string}   htmlPath    Absolute path to the HTML file.
 * @param {string}   outputBase  Output path without extension.
 * @param {string}   sheet       Sheet to render.
 * @param {string[]} formats     Subset of ['pdf', 'jpg'] to render.
 */
async function render(htmlPath, outputBase, sheet, formats) {
  const browser = await puppeteer.launch();

  const WIDTH = 842
  const HEIGHT = (sheet == 'ruler') ? 130 : 595

  if (formats.includes('pdf')) {
    const page = await browser.newPage();
    await page.goto(`file://${path.resolve(htmlPath)}`, { waitUntil: 'networkidle0' });

    // Increase viewport scale for higher resolution screenshot
    const margin = 10
    await page.setViewport({ width: WIDTH + 2 * margin, height: HEIGHT + 2 * margin, deviceScaleFactor: 4 });
    // Center the content in PDF page
    await page.addStyleTag({
      content: `@page { margin-top: ${margin}px; }`,
    })

    await page.pdf({
      path: `${outputBase}.pdf`,
      scale: 1.3, // Use rendering scale instead of CSS zoom to prevent flex elements changes
      printBackground: true,
    });
  }

  if (formats.includes('jpg')) {
    const page = await browser.newPage();
    await page.goto(`file://${path.resolve(htmlPath)}`, { waitUntil: 'networkidle0' });

    // Increase viewport scale for higher resolution screenshot
    await page.setViewport({ width: WIDTH, height: HEIGHT, deviceScaleFactor: 4 });

    await page.screenshot({
      path: `${outputBase}.jpg`,
      type: 'jpeg',
      quality: 90,
      fullPage: true,
    });
  }

  await browser.close();
}

module.exports = { render };
