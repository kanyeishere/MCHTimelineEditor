import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';

const ICON_BASE = 'https://ffxiv.gamerescape.com/wiki/Special:Redirect/file/';
const APP_SOURCE_PATH = 'app.js';
const OUTPUT_DIR = 'assets/icons';
const FORCE_DOWNLOAD = process.argv.includes('--force');

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
      'user-agent': 'Mozilla/5.0 (compatible; MCHTimelineEditor icon downloader)'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to download ${action.id} from ${url}: HTTP ${response.status}`);
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
