const fs = require('fs')
const path = require('path')
const sharp = require('sharp')

const projectRoot = path.join(__dirname, '..')
const destDir = path.join(projectRoot, 'public')
const destPng = path.join(destDir, 'logo.png')
const destFavicon = path.join(destDir, 'favicon.png')
const destSource = path.join(destDir, 'negus-source.png')

/**
 * Prefer the saved crest source in public/. Fall back to the Cursor assets
 * path for the current gold circular crest (not the old Instagram screenshot).
 */
const SOURCE_CANDIDATES = [
  destSource,
  path.join(
    process.env.USERPROFILE || '',
    '.cursor',
    'projects',
    'c-Users-kalid-OneDrive-Desktop-OBS-apps-trip-booking',
    'assets',
    'c__Users_kalid_AppData_Roaming_Cursor_User_workspaceStorage_66d2284522e4e8e94ed3174df4755274_images_image-e30f68ea-ef73-49fb-8fc5-be72d50aee99.png',
  ),
]

function resolveSource() {
  for (const p of SOURCE_CANDIDATES) {
    if (p && fs.existsSync(p)) return p
  }
  throw new Error('No logo source image found')
}

function lum(r, g, b) {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** Gold strokes on the double ring, crown, shield, and NEGUS letterforms. */
function isGold(r, g, b, a) {
  if (a < 8) return false
  if (r > 155 && g > 115 && b < 110 && r - b > 55 && g - b > 25 && Math.abs(r - g) < 90) {
    return true
  }
  const L = lum(r, g, b)
  return L > 62 && r > 95 && g > 68 && b < 145 && r - b > 22 && g - b > 8
}

/**
 * Bounding box of gold emblem pixels, then a square crop centered on the
 * circular crest with a little padding so the outer ring is not clipped.
 */
function detectGoldCircleCrop(data, w, h) {
  let minx = w
  let miny = h
  let maxx = 0
  let maxy = 0
  let points = 0

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4
      if (isGold(data[i], data[i + 1], data[i + 2], data[i + 3])) {
        points++
        if (x < minx) minx = x
        if (y < miny) miny = y
        if (x > maxx) maxx = x
        if (y > maxy) maxy = y
      }
    }
  }

  if (points < 200) return null

  const cx = (minx + maxx) / 2
  const cy = (miny + maxy) / 2
  const halfW = (maxx - minx) / 2
  const halfH = (maxy - miny) / 2
  /** Pad ~5% outside the gold ring so BrandLogoMark object-contain keeps the ring intact. */
  const radius = Math.max(halfW, halfH) * 1.05

  let side = Math.ceil(radius * 2)
  let left = Math.floor(cx - radius)
  let top = Math.floor(cy - radius)
  left = Math.max(0, Math.min(left, w - side))
  top = Math.max(0, Math.min(top, h - side))
  side = Math.min(side, w - left, h - top)

  return {
    left,
    top,
    side,
    points,
    minx,
    miny,
    maxx,
    maxy,
    cx,
    cy,
    radius,
  }
}

async function main() {
  const src = resolveSource()

  // Keep a durable copy under public/ for future crops.
  if (path.resolve(src) !== path.resolve(destSource)) {
    await fs.promises.copyFile(src, destSource)
  }

  const meta = await sharp(src).metadata()
  const w = meta.width
  const h = meta.height
  const { data } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true })

  const crop = detectGoldCircleCrop(data, w, h)
  if (!crop) throw new Error('Could not detect gold circular crest')

  console.log({
    src,
    gold: {
      points: crop.points,
      minx: crop.minx,
      miny: crop.miny,
      maxx: crop.maxx,
      maxy: crop.maxy,
    },
    crop: { left: crop.left, top: crop.top, side: crop.side },
  })

  const OUT = 640
  // Keep the full crest (black disk + gold double ring) — do not strip to gold-only.
  await sharp(src)
    .extract({ left: crop.left, top: crop.top, width: crop.side, height: crop.side })
    .resize(OUT, OUT, { kernel: sharp.kernel.lanczos3 })
    .png()
    .toFile(destPng)

  const FAV = 96
  await sharp(destPng).resize(FAV, FAV, { kernel: sharp.kernel.lanczos3 }).png().toFile(destFavicon)

  console.log('ok', { destPng, destFavicon, size: `${OUT}x${OUT}`, favicon: `${FAV}x${FAV}` })
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
