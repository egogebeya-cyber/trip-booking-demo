import { toWhatsAppNumber } from './phone'

export { toWhatsAppNumber }

export function whatsappHref(phone: string, text: string) {
  const number = toWhatsAppNumber(phone)
  if (!number) return `https://wa.me/?text=${encodeURIComponent(text)}`
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`
}

export function qrImageUrl(value: string, size = 240) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}`
}

export function exportCsv(filename: string, headers: string[], rows: (string | number | null | undefined)[][]) {
  const escape = (value: string | number | null | undefined) => {
    const text = String(value ?? '')
    if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`
    return text
  }
  const csv = '\uFEFF' + [headers.map(escape).join(','), ...rows.map((row) => row.map(escape).join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
