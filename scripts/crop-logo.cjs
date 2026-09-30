const fs = require('fs')
const path = require('path')
const sharp = require('sharp')

const projectRoot = path.join(__dirname, '..')
const destDir = path.join(projectRoot, 'public')
const destPng = path.join(destDir, 'logo.png')

const SOURCE_CANDIDATES = [
  path.join(destDir, 'negus-source.png'),
  path.join(
    process.env.USERPROFILE || '',
    '.cursor',
    'projects',
    'c-Users-kalid-OneDrive-Desktop-OBS-apps-trip-booking',
    'assets',
    'c__Users_kalid_AppData_Roaming_Cursor_User_workspaceStorage_66d2284522e4e8e94ed3174df4755274_images_image-0c998f71-3dea-4864-b37a-6199e567799e.png',
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

function isGold(r, g, b) {
  return (
    r > 155 &&
    g > 115 &&
    b < 110 &&
    r - b > 55 &&
    g - b > 25 &&
    Math.abs(r - g) < 90
  )
}

/** Dark charcoal inside the Instagram profile badge (not pure black UI chrome). */
function isBadgeFill(r, g, b) {
  const L = lum(r, g, b)
  return L >= 8 && L <= 72 && Math.max(r, g, b) - Math.min(r, g, b) < 42
}

/**
 * Find the circular profile-photo badge in an Instagram screenshot by sampling
 * radial rays from the image center for dark fill vs lighter surround.
 */
function detectBadgeCircle(data, w, h, hintCy) {
  const cx = w / 2
  const yMin = hintCy != null ? Math.floor(hintCy - h * 0.08) : Math.floor(h * 0.28)
  const yMax = hintCy != null ? Math.floor(hintCy + h * 0.08) : Math.floor(h * 0.62)
  let best = null

  for (let cy = yMin; cy < yMax; cy += 2) {
    const samples = []
    for (let deg = 0; deg < 360; deg += 6) {
      const rad = (deg * Math.PI) / 180
      let lastBadge = 0
      for (let r = 8; r < Math.min(w, h) * 0.48; r++) {
        const x = Math.round(cx + Math.cos(rad) * r)
        const y = Math.round(cy + Math.sin(rad) * r)
        if (x < 0 || x >= w || y < 0 || y >= h) break
        const i = (y * w + x) * 4
        if (isBadgeFill(data[i], data[i + 1], data[i + 2])) lastBadge = r
        else if (lastBadge > 40) break
      }
      if (lastBadge > 40) samples.push(lastBadge)
    }
    if (samples.length < 24) continue
    samples.sort((a, b) => a - b)
    const radius = samples[Math.floor(samples.length * 0.55)]
    const score = samples.length * radius
    if (!best || score > best.score) best = { cx, cy, radius, score }
  }

  if (!best) return null
  return { cx: best.cx, cy: best.cy, radius: best.radius * 1.02 }
}

function detectGoldBounds(data, w, h) {
  const y0 = Math.floor(h * 0.12)
  const y1 = Math.floor(h * 0.68)
  const points = []
  for (let y = y0; y < y1; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4
      if (isGold(data[i], data[i + 1], data[i + 2])) points.push([x, y])
    }
  }
  if (points.length < 200) return null

  let minx = w,
    miny = h,
    maxx = 0,
    maxy = 0,
    sx = 0,
    sy = 0
  for (const [x, y] of points) {
    sx += x
    sy += y
    if (x < minx) minx = x
    if (y < miny) miny = y
    if (x > maxx) maxx = x
    if (y > maxy) maxy = y
  }
  const cx = sx / points.length
  const cy = sy / points.length
  const half = Math.max((maxx - minx) / 2, (maxy - miny) / 2)
  return { cx, cy, radius: half * 1.34, points: points.length, minx, miny, maxx, maxy }
}

function clampSquare(cx, cy, radius, w, h) {
  let side = Math.ceil(radius * 2)
  let left = Math.floor(cx - radius)
  let top = Math.floor(cy - radius)
  left = Math.max(0, Math.min(left, w - side))
  top = Math.max(0, Math.min(top, h - side))
  side = Math.min(side, w - left, h - top)
  return { left, top, side, cx: left + side / 2, cy: top + side / 2, radius: side / 2 }
}

async function main() {
  const src = resolveSource()
  const meta = await sharp(src).metadata()
  const w = meta.width
  const h = meta.height
  const { data } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true })

  const gold = detectGoldBounds(data, w, h)
  if (!gold) throw new Error('Could not detect gold logo artwork')

  const badge = detectBadgeCircle(data, w, h, gold.cy)
  const cx = gold.cx
  const cy = gold.cy
  let radius = gold.radius
  if (badge && Math.abs(badge.cy - gold.cy) < h * 0.12) {
    radius = Math.min(Math.max(badge.radius, gold.radius), gold.radius * 1.12)
  }

  const crop = clampSquare(cx, cy, radius, w, h)
  console.log({
    src,
    badge,
    gold: gold
      ? { points: gold.points, minx: gold.minx, miny: gold.miny, maxx: gold.maxx, maxy: gold.maxy }
      : null,
    crop,
  })

  const ARTWORK_SCALE = 0.9
  const OUT = 640
  const inner = Math.round(OUT * ARTWORK_SCALE)
  const DISK = { r: 14, g: 14, b: 16, alpha: 1 }

  const scaled = await sharp(src)
    .extract({ left: crop.left, top: crop.top, width: crop.side, height: crop.side })
    .resize(inner, inner)
    .png()
    .toBuffer()

  const padded = await sharp({
    create: {
      width: OUT,
      height: OUT,
      channels: 4,
      background: DISK,
    },
  })
    .composite([{ input: scaled, gravity: 'center' }])
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const out = Buffer.from(padded.data)
  const ow = padded.info.width
  const oh = padded.info.height
  const ocx = ow / 2
  const ocy = oh / 2
  const orr = Math.min(ocx, ocy) - 0.5
  for (let y = 0; y < oh; y++) {
    for (let x = 0; x < ow; x++) {
      const i = (y * ow + x) * 4
      const dx = x - ocx
      const dy = y - ocy
      if (dx * dx + dy * dy > orr * orr) out[i + 3] = 0
    }
  }

  await sharp(out, { raw: { width: ow, height: oh, channels: 4 } }).png().toFile(destPng)
  await sharp(destPng).resize(96, 96).png().toFile(path.join(destDir, 'favicon.png'))
  console.log('ok', { destPng, size: `${OUT}x${OUT}`, artworkScale: ARTWORK_SCALE })
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
