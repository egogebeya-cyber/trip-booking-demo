import type { ReactNode } from 'react'
import { cn } from '~/lib/utils'

export function SectionHeading({
  kicker,
  title,
  desc,
  descClassName,
  align = 'center',
}: {
  kicker: ReactNode
  title: ReactNode
  desc?: ReactNode
  descClassName?: string
  align?: 'center' | 'left'
}) {
  return (
    <div className={align === 'center' ? 'mb-12 text-center' : 'mb-10'}>
      <p className="section-kicker">{kicker}</p>
      <div>
        <h2 className="section-heading">{title}</h2>
      </div>
      {desc ? (
        <div
          className={cn(
            'mt-2 max-w-2xl text-[1.05rem] leading-8 text-muted',
            align === 'center' && 'mx-auto',
            descClassName,
          )}
        >
          {desc}
        </div>
      ) : null}
    </div>
  )
}
