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

/** Anti-aliased / slightly dim gold strokes on the ring and letterforms. */
function isEmblemGold(r, g, b, a) {
  if (a < 8) return false
  if (isGold(r, g, b)) return true
  const L = lum(r, g, b)
  return L > 78 && r > 120 && g > 88 && b < 130 && r - b > 35 && g - b > 12
}

/** Thin crown filigree and outer ring hairlines. */
function isThinGold(r, g, b, a) {
  if (a < 6) return false
  if (isEmblemGold(r, g, b, a)) return true
  const L = lum(r, g, b)
  return L > 62 && r > 95 && g > 68 && b < 145 && r - b > 22 && g - b > 8
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
  const y0 = Math.floor(h * 0.08)
  /** Include NEGUS banner below the shield (was clipped at ~72% height). */
  const y1 = Math.floor(h * 0.94)
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
    maxy = 0
  for (const [x, y] of points) {
    if (x < minx) minx = x
    if (y < miny) miny = y
    if (x > maxx) maxx = x
    if (y > maxy) maxy = y
  }

  /** Crown tips are often softer gold — extend top within the emblem column only. */
  const xPad = Math.round((maxx - minx) * 0.12)
  const xLo = Math.max(0, minx - xPad)
  const xHi = Math.min(w - 1, maxx + xPad)
  const crownY0 = Math.floor(h * 0.22)
  for (let y = crownY0; y < miny; y++) {
    for (let x = xLo; x <= xHi; x++) {
      const i = (y * w + x) * 4
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      const a = data[i + 3]
      if (isThinGold(r, g, b, a)) {
        if (y < miny) miny = y
        if (x < minx) minx = x
        if (x > maxx) maxx = x
      }
    }
  }

  const bboxCx = (minx + maxx) / 2
  /** Geometric vertical center so the crown is not clipped when NEGUS pulls the centroid down. */
  const bboxCy = (miny + maxy) / 2
  const halfW = (maxx - minx) / 2
  const halfH = (maxy - miny) / 2
  const reachTop = bboxCy - miny
  const reachBottom = maxy - bboxCy
  const reachSide = halfW
  const radius = Math.max(reachTop, reachBottom, reachSide) * 1.17
  return {
    cx: bboxCx,
    cy: bboxCy,
    radius,
    points: points.length,
    minx,
    miny,
    maxx,
    maxy,
    halfW,
    halfH,
  }
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
  const radius = gold.radius

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
  /** Midnight navy — matches --negus-logo-fill (#0f1729) baked into the disk. */
  const LOGO_DISK = { r: 15, g: 23, b: 41 }
  const FAVICON_DISK = LOGO_DISK

  const scaled = await sharp(src)
    .extract({ left: crop.left, top: crop.top, width: crop.side, height: crop.side })
    .resize(inner, inner, { kernel: sharp.kernel.lanczos3 })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const artW = scaled.info.width
  const artH = scaled.info.height
  const artData = scaled.data

  const artLeft = Math.floor((OUT - artW) / 2)
  const artTop = Math.floor((OUT - artH) / 2)

  const out = Buffer.alloc(OUT * OUT * 4, 0)
  const ocx = OUT / 2
  const ocy = OUT / 2
  const orr = OUT / 2 - 0.5
  const orr2 = orr * orr

  for (let y = 0; y < OUT; y++) {
    for (let x = 0; x < OUT; x++) {
      const i = (y * OUT + x) * 4
      const dx = x - ocx
      const dy = y - ocy
      if (dx * dx + dy * dy > orr2) continue

      out[i] = LOGO_DISK.r
      out[i + 1] = LOGO_DISK.g
      out[i + 2] = LOGO_DISK.b
      out[i + 3] = 255

      const ax = x - artLeft
      const ay = y - artTop
      if (ax >= 0 && ax < artW && ay >= 0 && ay < artH) {
        const ai = (ay * artW + ax) * 4
        const r = artData[ai]
        const g = artData[ai + 1]
        const b = artData[ai + 2]
        const a = artData[ai + 3]
        if (isThinGold(r, g, b, a)) {
          out[i] = r
          out[i + 1] = g
          out[i + 2] = b
          out[i + 3] = 255
        }
      }
    }
  }

  await sharp(out, { raw: { width: OUT, height: OUT, channels: 4 } }).png().toFile(destPng)

  const FAV = 96
  const fav = Buffer.alloc(FAV * FAV * 4, 0)
  const fcx = FAV / 2
  const fcy = FAV / 2
  const favDiskR = FAV * 0.46
  const favDiskR2 = favDiskR * favDiskR
  for (let y = 0; y < FAV; y++) {
    for (let x = 0; x < FAV; x++) {
      const i = (y * FAV + x) * 4
      const dx = x - fcx
      const dy = y - fcy
      const d2 = dx * dx + dy * dy
      if (d2 > favDiskR2) continue

      const sx = Math.round((x / (FAV - 1)) * (OUT - 1))
      const sy = Math.round((y / (FAV - 1)) * (OUT - 1))
      const oi = (sy * OUT + sx) * 4
      const emblemA = out[oi + 3]
      if (emblemA > 12) {
        fav[i] = out[oi]
        fav[i + 1] = out[oi + 1]
        fav[i + 2] = out[oi + 2]
        fav[i + 3] = emblemA
      } else {
        fav[i] = FAVICON_DISK.r
        fav[i + 1] = FAVICON_DISK.g
        fav[i + 2] = FAVICON_DISK.b
        fav[i + 3] = 255
      }
    }
  }
  await sharp(fav, { raw: { width: FAV, height: FAV, channels: 4 } })
    .png()
    .toFile(path.join(destDir, 'favicon.png'))
  console.log('ok', { destPng, size: `${OUT}x${OUT}`, artworkScale: ARTWORK_SCALE })
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
