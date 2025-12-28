/**
 * Postbuild script for GitHub Pages SPA support
 * Copies index.html to 404.html so that client-side routing works on page refresh
 */
import { copyFileSync, existsSync } from 'fs';
import { join } from 'path';

const distPath = 'dist/searchcraft/browser';
const indexPath = join(distPath, 'index.html');
const notFoundPath = join(distPath, '404.html');

if (existsSync(indexPath)) {
  copyFileSync(indexPath, notFoundPath);
  console.log('✓ Created 404.html from index.html for GitHub Pages SPA support');
} else {
  console.error('✗ index.html not found in', distPath);
  process.exit(1);
}
