const path = require('path')
const sharp = require('sharp')

const src = path.join(__dirname, '..', 'public', 'negus-source.png')
const destDir = path.join(__dirname, '..', 'public')
const destPng = path.join(destDir, 'logo.png')

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

async function main() {
  const meta = await sharp(src).metadata()
  const w = meta.width
  const h = meta.height
  const { data } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true })

  // Ignore top Instagram chrome (~12% of height)
  const y0 = Math.floor(h * 0.12)
  const y1 = Math.floor(h * 0.55)
  const points = []
  for (let y = y0; y < y1; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4
      if (isGold(data[i], data[i + 1], data[i + 2])) points.push([x, y])
    }
  }
  if (points.length < 200) throw new Error('not enough gold pixels: ' + points.length)

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
  const halfW = (maxx - minx) / 2
  const halfH = (maxy - miny) / 2
  const half = Math.max(halfW, halfH)
  // pad to include dark disc around crest
  const radius = half * 1.22
  let left = Math.floor(cx - radius)
  let top = Math.floor(cy - radius)
  let side = Math.ceil(radius * 2)
  left = Math.max(0, Math.min(left, w - side))
  top = Math.max(0, Math.min(top, h - side))
  side = Math.min(side, w - left, h - top)
  console.log({ points: points.length, minx, miny, maxx, maxy, cx, cy, left, top, side })

  const cropped = await sharp(src)
    .extract({ left, top, width: side, height: side })
    .resize(640, 640)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const out = Buffer.from(cropped.data)
  const ow = cropped.info.width
  const oh = cropped.info.height
  const ocx = ow / 2
  const ocy = oh / 2
  const orr = Math.min(ocx, ocy) - 1
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
  console.log('ok', destPng)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
