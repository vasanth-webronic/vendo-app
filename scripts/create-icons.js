#!/usr/bin/env node

/**
 * Simple script to create placeholder PWA icons
 * Run: node scripts/create-icons.js
 * 
 * Note: For production, replace these with proper designed icons
 */

const fs = require('fs');
const path = require('path');

// Create a simple SVG icon
const createSVGIcon = (size) => `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#4A90D9"/>
  <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${size * 0.4}" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="central">VM</text>
</svg>`;

// For now, create a note file since we can't generate PNG without image libraries
const iconNote = `# PWA Icons Required

To enable PWA install prompt, you need to create the following icon files:

1. icon-192.png (192x192 pixels)
2. icon-512.png (512x512 pixels)

You can:
- Use an online icon generator (e.g., https://realfavicongenerator.net/)
- Use design tools (Figma, Photoshop, etc.)
- Use the favicon.ico as a base and resize it

Place both files in the /public directory.

For now, the app will work but the install prompt may not show until icons are added.
`;

console.log('Creating icon placeholder files...');

// Create note file
fs.writeFileSync(
  path.join(__dirname, '../public/ICON_INSTRUCTIONS.md'),
  iconNote
);

// Create SVG versions (browsers can use SVG in some cases)
fs.writeFileSync(
  path.join(__dirname, '../public/icon-192.svg'),
  createSVGIcon(192)
);
fs.writeFileSync(
  path.join(__dirname, '../public/icon-512.svg'),
  createSVGIcon(512)
);

console.log('✓ Created SVG icons and instructions');
console.log('⚠️  You still need to create PNG icons (icon-192.png and icon-512.png)');
console.log('   See public/ICON_INSTRUCTIONS.md for details');
