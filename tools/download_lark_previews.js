const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const LARK_BASE_URL = 'https://open.larksuite.com/open-apis';

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

function sha256File(filePath) {
  const data = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(data).digest('hex');
}

async function fetchTenantToken(appId, appSecret) {
  const response = await fetch(`${LARK_BASE_URL}/auth/v3/tenant_access_token/internal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      app_id: appId,
      app_secret: appSecret,
    }),
  });
  const data = await response.json();
  if (data.code !== 0) {
    throw new Error(data.msg || 'Failed to fetch tenant access token.');
  }
  return data.tenant_access_token;
}

async function downloadImage(token, imageKey) {
  const response = await fetch(`${LARK_BASE_URL}/im/v1/images/${imageKey}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    throw new Error(`Failed to download image_key=${imageKey}: ${response.status}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function main() {
  const args = parseArgs(process.argv);
  const baselineDir = args['baseline-dir'];
  const outputDir = args['output-dir'];
  const cacheFile =
    args['cache-file'] || path.join('sign', 'lark_preview_images', 'lark_image_key_cache.json');
  const appId = args['app-id'] || process.env.LARK_APP_ID;
  const appSecret = args['app-secret'] || process.env.LARK_APP_SECRET;

  if (!baselineDir || !outputDir) {
    throw new Error('Missing required --baseline-dir or --output-dir');
  }
  if (!appId || !appSecret) {
    throw new Error('Missing Lark credentials. Use --app-id/--app-secret or env LARK_APP_ID/LARK_APP_SECRET.');
  }

  if (!fs.existsSync(cacheFile)) {
    throw new Error(`Cache file not found: ${cacheFile}`);
  }

  ensureDir(outputDir);

  const cache = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
  const token = await fetchTenantToken(appId, appSecret);

  const files = fs
    .readdirSync(baselineDir)
    .filter((file) => file.toLowerCase().endsWith('.png'));

  for (const filename of files) {
    const baselinePath = path.join(baselineDir, filename);
    const fileHash = sha256File(baselinePath);
    const imageKey = cache[fileHash];
    if (!imageKey) {
      console.warn(`[skip] No image key for hash ${fileHash} (${filename})`);
      continue;
    }
    const imageBytes = await downloadImage(token, imageKey);
    const outputPath = path.join(outputDir, filename);
    fs.writeFileSync(outputPath, imageBytes);
    console.log(`[saved] ${outputPath}`);
  }
}

main().catch((error) => {
  console.error(`[error] ${error.message}`);
  process.exitCode = 1;
});
