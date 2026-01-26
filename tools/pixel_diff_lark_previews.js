const fs = require('fs');
const path = require('path');
const pixelmatch = require('pixelmatch');
const { PNG } = require('pngjs');

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

function normalizeRelative(from, target) {
  return path.relative(from, target).replace(/\\/g, '/');
}

function loadPng(filePath) {
  const data = fs.readFileSync(filePath);
  return PNG.sync.read(data);
}

function writePng(filePath, png) {
  const buffer = PNG.sync.write(png);
  fs.writeFileSync(filePath, buffer);
}

function buildReport(entries, outputDir) {
  const rows = entries
    .map((entry) => {
      return `
        <tr>
          <td>${entry.filename}</td>
          <td>${entry.dimensions}</td>
          <td>${entry.diffPixels}</td>
          <td><img src="${entry.baselineRel}" /></td>
          <td><img src="${entry.candidateRel}" /></td>
          <td><img src="${entry.diffRel}" /></td>
        </tr>
      `;
    })
    .join('\n');

  const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Lark Preview Pixel Diff Report</title>
    <style>
      body { font-family: Arial, sans-serif; padding: 20px; }
      table { border-collapse: collapse; width: 100%; }
      th, td { border: 1px solid #ddd; padding: 8px; vertical-align: top; }
      th { background: #f5f5f5; text-align: left; }
      img { max-width: 280px; border: 1px solid #ccc; background: #fff; }
    </style>
  </head>
  <body>
    <h1>Lark Preview Pixel Diff Report</h1>
    <table>
      <thead>
        <tr>
          <th>File</th>
          <th>Dimensions</th>
          <th>Diff Pixels</th>
          <th>Baseline</th>
          <th>Candidate</th>
          <th>Diff</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  </body>
</html>`;

  fs.writeFileSync(path.join(outputDir, 'report.html'), html);
}

function main() {
  const args = parseArgs(process.argv);
  const baselineDir = args['baseline-dir'];
  const candidateDir = args['candidate-dir'];
  const outputDir = args['output-dir'] || path.join('reports', 'lark_preview_diff');
  const threshold = Number.parseFloat(args.threshold ?? '0.1');

  if (!baselineDir || !candidateDir) {
    throw new Error('Missing required --baseline-dir or --candidate-dir');
  }

  ensureDir(outputDir);

  const baselineFiles = fs
    .readdirSync(baselineDir)
    .filter((file) => file.toLowerCase().endsWith('.png'));

  const entries = [];

  for (const filename of baselineFiles) {
    const baselinePath = path.join(baselineDir, filename);
    const candidatePath = path.join(candidateDir, filename);
    if (!fs.existsSync(candidatePath)) {
      console.warn(`[skip] Missing candidate: ${candidatePath}`);
      continue;
    }

    const baselinePng = loadPng(baselinePath);
    const candidatePng = loadPng(candidatePath);

    if (
      baselinePng.width !== candidatePng.width ||
      baselinePng.height !== candidatePng.height
    ) {
      console.warn(`[skip] Dimension mismatch: ${filename}`);
      continue;
    }

    const diffPng = new PNG({ width: baselinePng.width, height: baselinePng.height });
    const diffPixels = pixelmatch(
      baselinePng.data,
      candidatePng.data,
      diffPng.data,
      baselinePng.width,
      baselinePng.height,
      { threshold }
    );

    const diffName = `diff_${filename}`;
    const diffPath = path.join(outputDir, diffName);
    writePng(diffPath, diffPng);

    entries.push({
      filename,
      dimensions: `${baselinePng.width}x${baselinePng.height}`,
      diffPixels,
      baselineRel: normalizeRelative(outputDir, baselinePath),
      candidateRel: normalizeRelative(outputDir, candidatePath),
      diffRel: normalizeRelative(outputDir, diffPath),
    });
  }

  buildReport(entries, outputDir);
  console.log(`[report] ${path.join(outputDir, 'report.html')}`);
}

try {
  main();
} catch (error) {
  console.error(`[error] ${error.message}`);
  process.exitCode = 1;
}
