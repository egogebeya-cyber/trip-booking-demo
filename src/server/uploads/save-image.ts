import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { nanoid } from 'nanoid'

export async function saveUploadedImageDataUrl(dataUrl: string, prefix = '') {
  const match = dataUrl.match(/^data:(image\/(?:jpeg|jpg|png|webp));base64,(.+)$/i)
  if (!match) throw new Error('INVALID_IMAGE')

  const mime = match[1].toLowerCase()
  const ext = mime.includes('png') ? 'png' : mime.includes('webp') ? 'webp' : 'jpg'
  const buffer = Buffer.from(match[2], 'base64')
  if (buffer.length === 0 || buffer.length > 5 * 1024 * 1024) {
    throw new Error('INVALID_IMAGE')
  }

  const uploadsDir = join(process.cwd(), 'public', 'uploads')
  await mkdir(uploadsDir, { recursive: true })

  const fileName = `${prefix}${nanoid()}.${ext}`
  await writeFile(join(uploadsDir, fileName), buffer)

  return { url: `/uploads/${fileName}` }
}
