import sharp from 'sharp'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const publicDir = join(root, 'public')
const svg = readFileSync(join(publicDir, 'pwa-icon.svg'))

const sizes = [
  ['pwa-192x192.png', 192],
  ['pwa-512x512.png', 512],
  ['apple-touch-icon.png', 180],
]

for (const [name, size] of sizes) {
  await sharp(svg).resize(size, size).png().toFile(join(publicDir, name))
}

await sharp(svg).resize(48, 48).png().toFile(join(publicDir, 'favicon.png'))
console.log('Generated PWA icons in public/')
