const fs = require('fs')
const path = require('path')
const { createRequire } = require('module')

const src = String.raw`C:\Users\kalid\.cursor\projects\c-Users-kalid-OneDrive-Desktop-OBS-apps-trip-booking\assets\c__Users_kalid_AppData_Roaming_Cursor_User_workspaceStorage_66d2284522e4e8e94ed3174df4755274_images_image-6b1088ad-6dd2-4095-b808-f42c56ac0b4e.png`
const destDir = String.raw`C:\Users\kalid\OneDrive\Desktop\OBS\apps\bookings\trip booking\public`
const destPng = path.join(destDir, 'logo.png')
const destSource = path.join(destDir, 'negus-source.png')

if (!fs.existsSync(src)) {
  console.error('SOURCE_MISSING', src)
  process.exit(1)
}

fs.copyFileSync(src, destSource)
console.log('copied source', destSource, fs.statSync(destSource).size)

// Prefer sharp if available, else copy full image as logo.png
let sharp
try {
  sharp = require('sharp')
} catch {
  try {
    sharp = createRequire(path.join(destDir, '..', 'package.json'))('sharp')
  } catch {
    sharp = null
  }
}

async function main() {
  if (!sharp) {
    fs.copyFileSync(src, destPng)
    console.log('sharp missing, copied full image to logo.png')
    return
  }

  const meta = await sharp(src).metadata()
  const w = meta.width || 0
  const h = meta.height || 0
  console.log('meta', w, h)

  // Crop center circle region of the phone screenshot (logo is center-upper)
  // Approximate: logo occupies roughly middle 55% width, from ~18% to ~55% height
  const size = Math.floor(Math.min(w, h) * 0.58)
  const left = Math.floor((w - size) / 2)
  const top = Math.floor(h * 0.16)

  const cropped = await sharp(src)
    .extract({ left, top, width: size, height: size })
    .resize(512, 512)
    .png()
    .toBuffer()

  // Make outside circle transparent
  const { data, info } = await sharp(cropped)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const cx = info.width / 2
  const cy = info.height / 2
  const r = Math.min(cx, cy) - 2
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const i = (y * info.width + x) * 4
      const dx = x - cx
      const dy = y - cy
      if (dx * dx + dy * dy > r * r) data[i + 3] = 0
    }
  }

  await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
    .png()
    .toFile(destPng)

  // Favicon from same crop
  await sharp(destPng).resize(64, 64).png().toFile(path.join(destDir, 'favicon.png'))
  console.log('saved', destPng)
}

main().catch((e) => {
  console.error(e)
  fs.copyFileSync(src, destPng)
  console.log('fallback copied full image')
})
