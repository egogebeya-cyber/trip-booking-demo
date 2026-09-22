import type { ReactNode } from 'react'

export function SectionHeading({
  kicker,
  title,
  desc,
  align = 'center',
}: {
  kicker: ReactNode
  title: ReactNode
  desc?: ReactNode
  align?: 'center' | 'left'
}) {
  return (
    <div className={align === 'center' ? 'mb-12 text-center' : 'mb-10'}>
      <p className="section-kicker">{kicker}</p>
      <div>
        <h2 className="section-heading">{title}</h2>
      </div>
      {desc ? (
        <div className={`mt-2 max-w-2xl text-[1.05rem] leading-8 text-muted ${align === 'center' ? 'mx-auto' : ''}`}>
          {desc}
        </div>
      ) : null}
    </div>
  )
}
