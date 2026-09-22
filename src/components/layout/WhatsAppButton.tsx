import { MessageCircle } from 'lucide-react'

type WhatsAppButtonProps = {
  number?: string | null
  message?: string
}

export function WhatsAppButton({ number, message }: WhatsAppButtonProps) {
  if (!number) return null
  const text = encodeURIComponent(message ?? 'Hi, I would like to inquire about a trip.')
  const href = `https://wa.me/${number.replace(/\D/g, '')}?text=${text}`

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition hover:scale-105"
      aria-label="WhatsApp"
    >
      <MessageCircle className="h-7 w-7" />
    </a>
  )
}
