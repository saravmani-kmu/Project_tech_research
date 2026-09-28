#!/usr/bin/env node
/**
 * Post-build step for GitHub Pages:
 *  1. Copies the repo-root data/ (YAML fetched by the backend jobs) into the build output,
 *     so the static site can read it via a relative fetch.
 *  2. Duplicates index.html as 404.html so client-side routing works on GitHub Pages
 *     (which has no server-side rewrite rules for a single-page app).
 */
const fs = require('fs');
const path = require('path');

const targetDir = process.argv[2];
if (!targetDir) {
  console.error('Usage: node copy-data.js <build-output-dir>');
  process.exit(1);
}

const repoRoot = path.resolve(__dirname, '..', '..');
const sourceData = path.join(repoRoot, 'data');
const destData = path.join(targetDir, 'data');

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

if (!fs.existsSync(sourceData)) {
  console.error(`No data/ directory found at ${sourceData}`);
  process.exit(1);
}

fs.rmSync(destData, { recursive: true, force: true });
copyRecursive(sourceData, destData);
console.log(`Copied ${sourceData} -> ${destData}`);

const indexHtml = path.join(targetDir, 'index.html');
const notFoundHtml = path.join(targetDir, '404.html');
if (fs.existsSync(indexHtml)) {
  fs.copyFileSync(indexHtml, notFoundHtml);
  console.log(`Copied ${indexHtml} -> ${notFoundHtml}`);
}
