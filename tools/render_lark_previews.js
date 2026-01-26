const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i += 1) {
    const current = argv[i];
    if (!current.startsWith('--')) {
      continue;
    }
    const key = current.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith('--')) {
      args[key] = true;
    } else {
      args[key] = next;
      i += 1;
    }
  }
  return args;
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function isAbsoluteUrl(value) {
  return /^https?:\/\//i.test(value);
}

function joinUrl(base, pathname) {
  return `${base.replace(/\/$/, '')}${pathname}`;
}

function defaultDates() {
  const dates = [];
  const today = new Date();
  for (let i = 0; i < 5; i += 1) {
    const next = new Date(today);
    next.setDate(today.getDate() + i);
    const year = next.getFullYear();
    const month = String(next.getMonth() + 1).padStart(2, '0');
    const day = String(next.getDate()).padStart(2, '0');
    dates.push(`${year}-${month}-${day}`);
  }
  return dates;
}

function formatDateLabel(dateIso) {
  const [year, month, day] = dateIso.split('-').map(Number);
  if (!year || !month || !day) {
    return '';
  }
  return `${month}.${day}.${String(year).slice(-2)}`;
}

async function renderPreview({
  frontendUrl,
  backendUrl,
  signatureUrl,
  outputDir,
  dates,
  seed,
  force,
  viewportWidth,
  viewportHeight,
  deviceScaleFactor,
}) {
  ensureDir(outputDir);

  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: {
      width: viewportWidth,
      height: viewportHeight,
    },
    deviceScaleFactor,
  });

  page.on('console', (message) => {
    if (message.type() === 'error') {
      console.error(`[page error] ${message.text()}`);
    }
  });
  page.on('pageerror', (error) => {
    console.error(`[page exception] ${error.message}`);
  });

  await page.route('**/sign/**', async (route) => {
    const requested = new URL(route.request().url());
    await route.continue({ url: joinUrl(backendUrl, requested.pathname) });
  });

  await page.route('**/uploads/**', async (route) => {
    const requested = new URL(route.request().url());
    await route.continue({ url: joinUrl(backendUrl, requested.pathname) });
  });

  for (const date of dates) {
    const filename = `date_${date}_seed${seed}.png`;
    const outputPath = path.join(outputDir, filename);
    if (!force && fs.existsSync(outputPath)) {
      console.log(`[skip] ${outputPath}`);
      continue;
    }

    const targetUrl = new URL(frontendUrl);
    targetUrl.searchParams.set('render', 'lark-preview');
    targetUrl.searchParams.set('date', date);
    targetUrl.searchParams.set('signature', signatureUrl);
    targetUrl.searchParams.set('seed', String(seed));

    console.log(`[render] ${targetUrl.toString()}`);
    await page.goto(targetUrl.toString(), { waitUntil: 'networkidle' });
    await page.waitForSelector('[data-lark-preview-target]', { state: 'attached' });
    const expectedLabel = formatDateLabel(date);
    if (expectedLabel) {
      await page.waitForFunction(
        (label) => {
          const target = document.querySelector('[data-lark-preview-target]');
          return target && target.getAttribute('data-lark-preview-date') === label;
        },
        expectedLabel
      );
    }
    await page.waitForFunction(() => {
      const images = Array.from(document.images);
      return images.every((img) => img.complete && img.naturalWidth > 0);
    });

    const element = await page.$('[data-lark-preview-target]');
    if (!element) {
      throw new Error('Preview element not found.');
    }
    await element.waitForElementState('visible');
    await element.screenshot({ path: outputPath });
    console.log(`[saved] ${outputPath}`);
  }

  await browser.close();
}

async function main() {
  const args = parseArgs(process.argv);
  const frontendUrl = args['frontend-url'] || 'http://localhost:3000';
  const backendUrl = args['backend-url'] || 'http://localhost:8000';
  const outputDir = args['output-dir'];
  const seed = Number.parseInt(args.seed ?? '0', 10);
  const dates = args.dates ? args.dates.split(',') : defaultDates();
  const force = Boolean(args.force);
  const viewportWidth = Number.parseInt(args['viewport-width'] ?? '800', 10);
  const viewportHeight = Number.parseInt(args['viewport-height'] ?? '600', 10);
  const deviceScaleFactor = Number.parseFloat(args['device-scale-factor'] ?? '1');

  if (!outputDir) {
    throw new Error('Missing required --output-dir');
  }

  const rawSignatureUrl = args['signature-url'] || '/sign/atty_signatureSPM.png';
  const signatureUrl = isAbsoluteUrl(rawSignatureUrl)
    ? rawSignatureUrl
    : joinUrl(backendUrl, rawSignatureUrl.startsWith('/') ? rawSignatureUrl : `/${rawSignatureUrl}`);

  await renderPreview({
    frontendUrl,
    backendUrl,
    signatureUrl,
    outputDir,
    dates,
    seed: Number.isNaN(seed) ? 0 : seed,
    force,
    viewportWidth,
    viewportHeight,
    deviceScaleFactor,
  });
}

main().catch((error) => {
  console.error(`[error] ${error.message}`);
  process.exitCode = 1;
});
