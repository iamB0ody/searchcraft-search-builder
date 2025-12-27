#!/usr/bin/env node
/**
 * Icon Generation Script
 * Generates all required PNG icons from SVG source files using sharp.
 *
 * Usage: npm run generate-icons
 */

import sharp from 'sharp';
import { readFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Paths
const BRAND_DIR = join(rootDir, 'src/assets/brand');
const OUTPUT_DIR = join(rootDir, 'public/icons');

// Source SVG files
const PRIMARY_SVG = join(BRAND_DIR, 'icon.svg');
const MASKABLE_SVG = join(BRAND_DIR, 'icon-maskable.svg');

// Icon sizes to generate
const PRIMARY_SIZES = [
  { name: 'favicon-16x16.png', size: 16 },
  { name: 'favicon-32x32.png', size: 32 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'icon-48.png', size: 48 },
  { name: 'icon-72.png', size: 72 },
  { name: 'icon-96.png', size: 96 },
  { name: 'icon-128.png', size: 128 },
  { name: 'icon-144.png', size: 144 },
  { name: 'icon-152.png', size: 152 },
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-256.png', size: 256 },
  { name: 'icon-384.png', size: 384 },
  { name: 'icon-512.png', size: 512 },
];

const MASKABLE_SIZES = [
  { name: 'maskable-192.png', size: 192 },
  { name: 'maskable-512.png', size: 512 },
];

async function generateIcons() {
  console.log('Generating icons from SVG sources...\n');

  // Ensure output directory exists
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Read SVG files
  const primarySvg = readFileSync(PRIMARY_SVG);
  const maskableSvg = readFileSync(MASKABLE_SVG);

  // Generate primary icons
  console.log('Generating primary icons:');
  for (const { name, size } of PRIMARY_SIZES) {
    const outputPath = join(OUTPUT_DIR, name);
    await sharp(primarySvg)
      .resize(size, size)
      .png()
      .toFile(outputPath);
    console.log(`  ✓ ${name} (${size}x${size})`);
  }

  // Generate maskable icons
  console.log('\nGenerating maskable icons:');
  for (const { name, size } of MASKABLE_SIZES) {
    const outputPath = join(OUTPUT_DIR, name);
    await sharp(maskableSvg)
      .resize(size, size)
      .png()
      .toFile(outputPath);
    console.log(`  ✓ ${name} (${size}x${size})`);
  }

  console.log('\nIcon generation complete!');
  console.log(`Generated ${PRIMARY_SIZES.length + MASKABLE_SIZES.length} icons in ${OUTPUT_DIR}`);
}

generateIcons().catch((error) => {
  console.error('Error generating icons:', error);
  process.exit(1);
});
