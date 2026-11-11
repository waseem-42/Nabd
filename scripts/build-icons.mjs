// One canonical SVG drives the favicon and every install icon.
// Usage: npm run icons
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const outDir = path.join(root, 'public', 'icons')
const symbol = await readFile(path.join(root, 'public', 'brand', 'symbol.svg'), 'utf8')
await mkdir(outDir, { recursive: true })
await writeFile(path.join(root, 'public', 'favicon.svg'), symbol)

for (const size of [192, 512]) {
  await sharp(Buffer.from(symbol)).resize(size, size).png().toFile(path.join(outDir, `icon-${size}.png`))
  console.log(`icon-${size}.png: ${size}×${size}`)
}

// Full-bleed coral, with the symbol inside the central 80% safe zone.
const maskable = symbol
  .replace('<rect width="64" height="64" rx="20" fill="#FF785C"/>', '<rect width="64" height="64" fill="#FF785C"/><g transform="translate(8 8) scale(.75)">')
  .replace('</svg>', '</g></svg>')
await sharp(Buffer.from(maskable)).resize(512, 512).png().toFile(path.join(outDir, 'icon-maskable-512.png'))
console.log('icon-maskable-512.png: 512×512, full-bleed safe zone')
