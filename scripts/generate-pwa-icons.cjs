// Rebuild PWA raster icons from the tracked vector mark.
const fs = require('node:fs/promises');
const path = require('node:path');
// Sharp is already installed by the backend dependency set.
const sharp = require('../backend/node_modules/sharp');

async function main() {
  const directory = path.resolve(__dirname, '../frontend/public/icons');
  const svg = await fs.readFile(path.join(directory, 'favicon.svg'));
  await Promise.all([
    sharp(svg).resize(192, 192).png().toFile(path.join(directory, 'icon-192.png')),
    sharp(svg).resize(512, 512).png().toFile(path.join(directory, 'icon-512.png')),
    sharp(svg).resize(400, 400).extend({ top: 56, bottom: 56, left: 56, right: 56,
      background: '#070B14' }).png().toFile(path.join(directory, 'icon-maskable-512.png')),
  ]);
  console.log('PWA icons updated');
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
