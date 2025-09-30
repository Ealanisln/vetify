#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const srcDir = path.join(__dirname, '..', 'public');
const destDir = path.join(__dirname, '..', '.next', 'static', 'media');

// Ensure destination directory exists
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

// Copy all files from public directory to build output
function copyAssets(src, dest) {
  const items = fs.readdirSync(src);

  for (const item of items) {
    const srcPath = path.join(src, item);
    const destPath = path.join(dest, item);

    const stat = fs.statSync(srcPath);

    if (stat.isDirectory()) {
      if (!fs.existsSync(destPath)) {
        fs.mkdirSync(destPath, { recursive: true });
      }
      copyAssets(srcPath, destPath);
    } else {
      console.log(`Copying ${srcPath} to ${destPath}`);
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

try {
  copyAssets(srcDir, destDir);
  console.log('✅ Assets copied successfully to build output');
} catch (error) {
  console.error('❌ Error copying assets:', error.message);
  process.exit(1);
}
