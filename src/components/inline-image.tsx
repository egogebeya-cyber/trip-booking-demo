import { useState } from 'react'
import { cn } from '~/lib/utils'
import { useOptionalSiteEdit } from '~/components/site-edit-context'
import { uploadImageFn } from '~/server/admin/functions'

export async function uploadImageFile(file: File) {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('Could not read file'))
    reader.readAsDataURL(file)
  })
  const result = await uploadImageFn({ data: { dataUrl } })
  if (typeof result === 'string') return result
  if (result && typeof result === 'object' && 'url' in result) return String(result.url)
  throw new Error('Upload failed')
}

type InlineImageProps = {
  src?: string | null
  alt?: string
  className?: string
  imgClassName?: string
  onChange?: (url: string) => void
}

export function InlineImage({ src, alt = '', className, imgClassName, onChange }: InlineImageProps) {
  const edit = useOptionalSiteEdit()
  const [uploading, setUploading] = useState(false)
  const canEdit = Boolean(edit?.isAdmin && onChange)

  const onFile = async (file?: File) => {
    if (!file || !onChange) return
    setUploading(true)
    try {
      const url = await uploadImageFile(file)
      onChange(url)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className={cn('relative', className)}>
      {src ? (
        <img src={src} alt={alt} className={imgClassName} />
      ) : (
        <div className={cn('flex items-center justify-center bg-accent text-sm text-muted', imgClassName)}>
          No photo
        </div>
      )}
      {canEdit && (
        <label
          className="absolute bottom-2 left-2 z-20 cursor-pointer rounded-full bg-primary px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white shadow"
          onClick={(e) => e.stopPropagation()}
        >
          {uploading ? 'Uploading...' : src ? 'Change photo' : 'Add photo'}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            disabled={uploading}
            onChange={(e) => {
              void onFile(e.target.files?.[0])
              e.target.value = ''
            }}
          />
        </label>
      )}
    </div>
  )
}
