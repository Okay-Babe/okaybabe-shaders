#!/usr/bin/env node
/**
 * upload-r2.mjs — batch-upload rendered shader MP4s + posters to Cloudflare R2.
 *
 * Reads from apps/video/out/ (65 files: 13 shaders × 4 MP4 sizes + 13 poster JPGs).
 * Uploads each via `wrangler r2 object put` with content-type + immutable cache.
 * Emits apps/video/out/r2-manifest.json mapping {filename → public URL}.
 *
 * URL scheme: https://previews.okaybabe.dev/v1/<shader>-<variant>.<ext>
 *
 * Prerequisites:
 *   - CLOUDFLARE_API_TOKEN env var with R2 + Zone DNS scopes
 *   - wrangler 4.x installed (which wrangler)
 *   - R2 bucket okaybabe-pack-previews with custom domain previews.okaybabe.dev
 *
 * Usage: pnpm run upload-r2  (from apps/video/)
 */

import { execSync } from 'node:child_process';
import { readdirSync, writeFileSync, statSync } from 'node:fs';
import { join, resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

const BUCKET = 'okaybabe-pack-previews';
const CUSTOM_DOMAIN = 'previews.okaybabe.dev';
const VERSION = 'v1';
const OUT_DIR = resolve(__dirname, '..', 'out');
// Manifest lives OUTSIDE out/ so it's git-tracked (out/ is gitignored for MP4s)
const MANIFEST_PATH = resolve(__dirname, '..', 'r2-manifest.json');

function contentTypeFor(filename) {
  const ext = extname(filename).toLowerCase();
  if (ext === '.mp4') return 'video/mp4';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.png') return 'image/png';
  if (ext === '.webm') return 'video/webm';
  throw new Error(`unknown extension: ${ext}`);
}

function urlFor(filename) {
  return `https://${CUSTOM_DOMAIN}/${VERSION}/${filename}`;
}

function uploadFile(filepath, filename) {
  const ct = contentTypeFor(filename);
  const remoteKey = `${VERSION}/${filename}`;
  console.log(`  → ${filename} (${ct})`);

  const cmd = [
    'wrangler', 'r2', 'object', 'put',
    `${BUCKET}/${remoteKey}`,
    '--file', filepath,
    '--content-type', ct,
    '--cache-control', '"public, max-age=31536000, immutable"',
    '--remote',
  ].join(' ');

  try {
    execSync(cmd, { stdio: 'pipe' });
  } catch (err) {
    console.error(`    ❌ FAILED: ${err.message}`);
    throw err;
  }

  const stats = statSync(filepath);
  return { size: stats.size, contentType: ct };
}

function main() {
  console.log(`\n🔍 Scanning ${OUT_DIR}...\n`);

  const allFiles = readdirSync(OUT_DIR)
    .filter((f) => /\.(mp4|jpg|jpeg|png|webm)$/i.test(f))
    .sort();

  console.log(`Found ${allFiles.length} files. Expected 65 (13 × 4 MP4 + 13 posters).`);
  if (allFiles.length === 0) {
    console.error('❌ No files to upload. Run renders first.');
    process.exit(1);
  }

  try {
    execSync('which wrangler', { stdio: 'pipe' });
  } catch {
    console.error('❌ wrangler not found in PATH.');
    process.exit(1);
  }

  if (!process.env.CLOUDFLARE_API_TOKEN) {
    console.warn('⚠ CLOUDFLARE_API_TOKEN not set. wrangler may prompt interactively or fail.');
  }

  const manifest = {
    bucket: BUCKET,
    customDomain: CUSTOM_DOMAIN,
    version: VERSION,
    uploadedAt: new Date().toISOString(),
    files: {},
  };

  let succeeded = 0;
  let failed = 0;

  for (const filename of allFiles) {
    const filepath = join(OUT_DIR, filename);
    try {
      const { size, contentType } = uploadFile(filepath, filename);
      manifest.files[filename] = {
        url: urlFor(filename),
        size,
        contentType,
        uploadedAt: new Date().toISOString(),
      };
      succeeded++;
    } catch {
      failed++;
    }
  }

  writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
  console.log(`\n✅ Uploaded ${succeeded}/${allFiles.length} files`);
  if (failed > 0) {
    console.error(`❌ ${failed} failures`);
    process.exit(1);
  }
  console.log(`📋 Manifest: ${MANIFEST_PATH}`);
  console.log(`\nVerify: curl -I ${urlFor('halation-1080p.mp4')}`);
}

main();
