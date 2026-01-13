#!/usr/bin/env node

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function generateIcons() {
  const publicDir = path.join(__dirname, '../public');
  
  try {
    // Check if favicon exists
    const faviconPath = path.join(publicDir, 'favicon.ico');
    if (!fs.existsSync(faviconPath)) {
      console.log('⚠️  favicon.ico not found, creating simple icons...');
      await createSimpleIcons();
      return;
    }

    console.log('📦 Generating PWA icons from favicon.ico...');

    // Create 192x192 icon
    await sharp(faviconPath)
      .resize(192, 192, { fit: 'contain', background: { r: 74, g: 144, b: 217, alpha: 1 } })
      .png()
      .toFile(path.join(publicDir, 'icon-192.png'));
    console.log('✅ Created icon-192.png');

    // Create 512x512 icon
    await sharp(faviconPath)
      .resize(512, 512, { fit: 'contain', background: { r: 74, g: 144, b: 217, alpha: 1 } })
      .png()
      .toFile(path.join(publicDir, 'icon-512.png'));
    console.log('✅ Created icon-512.png');

    console.log('🎉 PWA icons generated successfully!');
  } catch (error) {
    console.error('❌ Error generating icons:', error.message);
    console.log('Creating simple placeholder icons...');
    await createSimpleIcons();
  }
}

async function createSimpleIcons() {
  const publicDir = path.join(__dirname, '../public');
  
  // Create simple blue square with "VM" text using SVG
  const svg192 = `<svg width="192" height="192" xmlns="http://www.w3.org/2000/svg">
    <rect width="192" height="192" fill="#4A90D9"/>
    <text x="96" y="120" font-family="Arial, sans-serif" font-size="80" font-weight="bold" fill="white" text-anchor="middle">VM</text>
  </svg>`;

  const svg512 = `<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
    <rect width="512" height="512" fill="#4A90D9"/>
    <text x="256" y="320" font-family="Arial, sans-serif" font-size="200" font-weight="bold" fill="white" text-anchor="middle">VM</text>
  </svg>`;

  try {
    // Convert SVG to PNG using sharp
    await sharp(Buffer.from(svg192))
      .png()
      .toFile(path.join(publicDir, 'icon-192.png'));
    console.log('✅ Created icon-192.png (placeholder)');

    await sharp(Buffer.from(svg512))
      .png()
      .toFile(path.join(publicDir, 'icon-512.png'));
    console.log('✅ Created icon-512.png (placeholder)');
  } catch (error) {
    console.error('❌ Error creating placeholder icons:', error.message);
    console.log('⚠️  Please create icon-192.png and icon-512.png manually');
  }
}

generateIcons();
