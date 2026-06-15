import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';

const ICON_BASE = 'https://ffxiv.gamerescape.com/wiki/Special:Redirect/file/';
const APP_SOURCE_PATH = 'app.js';
const OUTPUT_DIR = 'assets/icons';
const FORCE_DOWNLOAD = process.argv.includes('--force');
const COOKIE_ARG_INDEX = process.argv.indexOf('--cookie');
const COOKIE_HEADER = COOKIE_ARG_INDEX >= 0 ? process.argv[COOKIE_ARG_INDEX + 1] : process.env.GAMERESCAPE_COOKIE;

if (COOKIE_ARG_INDEX >= 0 && !COOKIE_HEADER) {
  throw new Error('Usage: npm run download:icons -- --cookie "name=value; other=value"');
}
const BROWSER_HEADERS = {
  accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
  'accept-language': 'en-US,en;q=0.9',
  'cache-control': 'no-cache',
  pragma: 'no-cache',
  priority: 'i',
  'sec-ch-ua': '"Chromium";v="125", "Not.A/Brand";v="24"',
  'sec-ch-ua-mobile': '?0',
  'sec-ch-ua-platform': '"Windows"',
  'sec-fetch-dest': 'image',
  'sec-fetch-mode': 'no-cors',
  'sec-fetch-site': 'same-origin',
  'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
};

const appSource = await readFile(APP_SOURCE_PATH, 'utf8');
const actionsSource = appSource.match(/const actions = \[([\s\S]*?)\]\s*\.map/)?.[1];

if (!actionsSource) {
  throw new Error(`Unable to find actions array in ${APP_SOURCE_PATH}`);
}

const actions = [];
for (const line of actionsSource.split('\n')) {
  if (!line.trimStart().startsWith('{ id: ')) continue;

  const id = line.match(/id: '([^']+)'/)?.[1];
  const en = line.match(/en: '([^']+)'/)?.[1] ?? line.match(/en: "([^"]+)"/)?.[1];

  if (!id || !en) {
    throw new Error(`Unable to parse action line: ${line}`);
  }

  actions.push({ id, en });
}

await mkdir(OUTPUT_DIR, { recursive: true });

let skipped = 0;
let downloaded = 0;

for (const action of actions) {
  const filename = `${action.en.replaceAll(' ', '_')}_Icon.png`;
  const url = `${ICON_BASE}${encodeURIComponent(filename)}`;
  const destination = `${OUTPUT_DIR}/${action.id}.png`;

  if (!FORCE_DOWNLOAD) {
    const existing = await stat(destination).catch(error => {
      if (error.code === 'ENOENT') return null;
      throw error;
    });

    if (existing?.size > 0) {
      skipped += 1;
      console.log(`Skipped existing ${destination}`);
      continue;
    }
  }

  const response = await fetch(url, {
    redirect: 'follow',
    headers: {
      ...BROWSER_HEADERS,
      referer: `https://ffxiv.gamerescape.com/wiki/${encodeURIComponent(action.en.replaceAll(' ', '_'))}`,
      ...(COOKIE_HEADER ? { cookie: COOKIE_HEADER } : {})
    }
  });

  if (!response.ok) {
    const cookieHint = COOKIE_HEADER ? '' : ' If this URL opens in your browser but not in Node, copy your ffxiv.gamerescape.com browser Cookie header and rerun with --cookie "..." or GAMERESCAPE_COOKIE="...".';
    throw new Error(`Failed to download ${action.id} from ${url}: HTTP ${response.status}.${cookieHint}`);
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('image/png')) {
    throw new Error(`Expected PNG for ${action.id} from ${url}, got ${contentType || 'unknown content type'}`);
  }

  await writeFile(destination, Buffer.from(await response.arrayBuffer()));
  downloaded += 1;
  console.log(`Downloaded ${destination}`);
}

console.log(`Icon download complete: ${downloaded} downloaded, ${skipped} skipped.`);
