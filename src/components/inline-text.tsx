import { useEffect, useRef } from 'react'
import { cn } from '~/lib/utils'
import { useOptionalSiteEdit } from '~/components/site-edit-context'

type InlineTextProps = {
  value: string
  onChange?: (value: string) => void
  className?: string
  multiline?: boolean
}

export function InlineText({ value, onChange, className, multiline }: InlineTextProps) {
  const edit = useOptionalSiteEdit()
  const canEdit = Boolean(edit?.isAdmin && onChange)
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!ref.current || document.activeElement === ref.current) return
    if (ref.current.innerText !== value) ref.current.innerText = value || ''
  }, [value])

  if (!canEdit) {
    return <span className={className}>{value}</span>
  }

  return (
    <span
      ref={ref}
      role="textbox"
      tabIndex={0}
      contentEditable
      suppressContentEditableWarning
      className={cn(
        'inline-block min-h-[1.4em] min-w-[5rem] max-w-full cursor-text rounded-md bg-orange-100 px-1 outline outline-2 outline-dashed outline-orange-500',
        multiline && 'block w-full whitespace-pre-wrap',
        className,
      )}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      onBlur={(e) => {
        const next = e.currentTarget.innerText.replace(/\u00a0/g, ' ').trimEnd()
        if (next !== value) onChange!(next)
      }}
    >
      {value || 'Type here'}
    </span>
  )
}
