import { BackButton } from '~/components/back-button'

const AUTH_BG = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=80'

export function AuthBackground({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden px-4 py-12">
      <img src={AUTH_BG} alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-[#2c2416]/55" />
      <div className="absolute left-4 top-4 z-20">
        <BackButton fallbackTo="/" className="border-white/80 bg-white/90" />
      </div>
      <div className="relative z-10 w-full max-w-md">{children}</div>
    </div>
  )
}
