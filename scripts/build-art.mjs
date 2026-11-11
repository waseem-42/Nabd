// Converts GymMane exercise illustrations (InlitX/GymMane, assets/art, CC BY-SA 4.0)
// into normalised JSON files under public/art/.
//
// Usage: node scripts/build-art.mjs [--refresh]
//   --refresh  re-download source files even if they are already cached

import { execFileSync } from 'node:child_process';
import { mkdir, readFile, rename, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import svgpath from 'svgpath';
import svgPathBounds from 'svg-path-bounds';

const REPO = 'InlitX/GymMane';
const API_URL = `https://api.github.com/repos/${REPO}/contents/assets/art`;
const RAW_BASE = `https://raw.githubusercontent.com/${REPO}/HEAD/assets/art/`;
const MIN_FILES = 300;
const CONCURRENCY = 8;
const RETRIES = 3;
const MAX_FAILURES = 5;
const TARGET = 1000;

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CACHE_DIR = path.join(ROOT, '.cache', 'art');
const OUT_DIR = path.join(ROOT, 'public', 'art');
const REFRESH = process.argv.includes('--refresh');
const MB = 1024 * 1024;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function listNames() {
  let names;
  try {
    const out = execFileSync('gh', ['api', `repos/${REPO}/contents/assets/art`, '--jq', '.[].name'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      maxBuffer: 64 * 1024 * 1024,
    });
    names = out.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
    console.log(`Listed via gh api: ${names.length} entries`);
  } catch (err) {
    console.warn(`gh api failed (${err.message.split('\n')[0]}); falling back to fetch`);
    const res = await fetch(API_URL, { headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'nabd-build-art' } });
    if (!res.ok) throw new Error(`GitHub API responded ${res.status} ${res.statusText}`);
    const json = await res.json();
    if (!Array.isArray(json)) throw new Error('GitHub API returned a non-array listing');
    names = json.map((e) => e.name);
    console.log(`Listed via fetch: ${names.length} entries`);
  }
  names = names.filter((n) => n.endsWith('.txt'));
  if (names.length < MIN_FILES) {
    throw new Error(`Only ${names.length} .txt files listed; expected about ${TARGET} (aborting, minimum ${MIN_FILES})`);
  }
  return names;
}

async function downloadOne(name) {
  const dest = path.join(CACHE_DIR, name);
  const url = RAW_BASE + encodeURIComponent(name);
  let lastErr;
  for (let attempt = 0; attempt <= RETRIES; attempt++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      const tmp = `${dest}.part`;
      await writeFile(tmp, text, 'utf8');
      await rename(tmp, dest);
      return;
    } catch (err) {
      lastErr = err;
      if (attempt < RETRIES) await sleep(500 * 2 ** attempt);
    }
  }
  throw new Error(`download failed after ${RETRIES + 1} attempts: ${lastErr.message}`);
}

async function ensureCached(names) {
  await mkdir(CACHE_DIR, { recursive: true });
  const failed = new Map();
  let next = 0;
  let downloaded = 0;
  let skipped = 0;
  const todo = [];
  for (const name of names) {
    const exists = await stat(path.join(CACHE_DIR, name)).then(() => true, () => false);
    if (exists && !REFRESH) skipped++;
    else todo.push(name);
  }
  console.log(`Cache: ${skipped} present, ${todo.length} to download${REFRESH ? ' (--refresh)' : ''}`);

  async function worker() {
    while (next < todo.length) {
      const name = todo[next++];
      try {
        await downloadOne(name);
        downloaded++;
      } catch (err) {
        failed.set(name, err.message);
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, todo.length) }, worker));
  console.log(`Downloaded ${downloaded} files`);
  return failed;
}

function convert(name, text) {
  const frames = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (frames.length === 0) throw new Error('no non-empty lines');

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const d of frames) {
    const [l, t, r, b] = svgPathBounds(d);
    if (![l, t, r, b].every(Number.isFinite)) throw new Error('non-finite bounds');
    minX = Math.min(minX, l);
    minY = Math.min(minY, t);
    maxX = Math.max(maxX, r);
    maxY = Math.max(maxY, b);
  }
  const width = maxX - minX;
  const height = maxY - minY;
  const size = Math.max(width, height);
  if (!(size > 0)) throw new Error('zero-size drawing');

  const k = TARGET / size;
  const W = Math.round(width * k);
  const H = Math.round(height * k);
  const out = frames.map((d) => svgpath(d).translate(-minX, -minY).scale(k).rel().round(0).toString());
  return JSON.stringify({ viewBox: [0, 0, W, H], frames: out });
}

async function main() {
  const t0 = Date.now();
  const names = await listNames();
  console.log(`Source files: ${names.length}`);

  const downloadFailed = await ensureCached(names);

  await mkdir(OUT_DIR, { recursive: true });
  const failures = [];
  for (const [name, msg] of downloadFailed) failures.push({ name, msg });

  const frameDist = new Map();
  let processed = 0;
  let srcBytes = 0;
  let outBytes = 0;

  for (const name of names) {
    if (downloadFailed.has(name)) continue;
    const src = path.join(CACHE_DIR, name);
    try {
      const text = await readFile(src, 'utf8');
      srcBytes += (await stat(src)).size;
      const json = convert(name, text);
      const slug = name.slice(0, -'.txt'.length);
      const dest = path.join(OUT_DIR, `${slug}.json`);
      await writeFile(dest, json, 'utf8');
      outBytes += Buffer.byteLength(json, 'utf8');
      const n = JSON.parse(json).frames.length;
      frameDist.set(n, (frameDist.get(n) ?? 0) + 1);
      processed++;
    } catch (err) {
      failures.push({ name, msg: err.message });
      console.error(`FAILED ${name}: ${err.message}`);
    }
  }

  // Source sizes for files that failed to download are not counted.
  const distLines = [...frameDist.entries()].sort((a, b) => a[0] - b[0]).map(([n, c]) => `${n} frame(s): ${c} files`);

  console.log('');
  console.log('=== Summary ===');
  console.log(`Files processed: ${processed} of ${names.length}`);
  console.log(`Files failed: ${failures.length}${failures.length ? ' - ' + failures.map((f) => f.name).join(', ') : ''}`);
  console.log(`Frames per file: ${distLines.join('; ') || 'n/a'}`);
  console.log(`Source .txt total: ${(srcBytes / MB).toFixed(2)} MB`);
  console.log(`Output .json total: ${(outBytes / MB).toFixed(2)} MB`);
  console.log(`Elapsed: ${((Date.now() - t0) / 1000).toFixed(1)} s`);

  if (failures.length > MAX_FAILURES) {
    console.error(`More than ${MAX_FAILURES} files failed (${failures.length}); exiting with code 1`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(`build-art: ${err.message}`);
  process.exit(1);
});
