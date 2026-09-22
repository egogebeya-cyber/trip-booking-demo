function pdfEscape(text: string) {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/[^\x20-\x7E]/g, '?')
}

export type InvoiceData = {
  businessName: string
  referenceNumber: string
  tripTitle: string
  customerName: string
  email: string
  phone: string
  travelDate: string
  guestCount: number
  totalPrice: number
  depositAmount?: number
  remainingAmount?: number
  paymentMethod?: string | null
  paymentStatus?: string | null
}

export function downloadInvoicePdf(data: InvoiceData) {
  const lines = [
    data.businessName.toUpperCase(),
    'BOOKING INVOICE',
    '',
    `Reference: ${data.referenceNumber}`,
    `Trip: ${data.tripTitle}`,
    `Guest: ${data.customerName}`,
    `Email: ${data.email}`,
    `Phone: ${data.phone}`,
    `Travel date: ${data.travelDate}`,
    `Guests: ${data.guestCount}`,
    `Payment: ${(data.paymentMethod || 'n/a').replace('_', ' ')} (${data.paymentStatus || 'pending'})`,
    `Total: ETB ${data.totalPrice.toLocaleString()}`,
  ]
  if (data.depositAmount) {
    lines.push(`Paid now: ETB ${data.depositAmount.toLocaleString()}`)
  }
  if (data.remainingAmount) {
    lines.push(`Remaining: ETB ${data.remainingAmount.toLocaleString()}`)
  }
  lines.push('', 'Thank you for booking with us.')

  const commands = ['BT', '/F1 18 Tf', '50 800 Td', `(${pdfEscape(lines[0] || 'Invoice')}) Tj`, '/F1 11 Tf']
  for (const line of lines.slice(1)) {
    commands.push('0 -18 Td', `(${pdfEscape(line || ' ')}) Tj`)
  }
  commands.push('ET')
  const stream = commands.join('\n')

  const objects = [
    '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n',
    '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n',
    '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj\n',
    `4 0 obj << /Length ${stream.length} >> stream\n${stream}\nendstream\nendobj\n`,
    '5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n',
  ]

  let body = '%PDF-1.4\n'
  const offsets = [0]
  for (const obj of objects) {
    offsets.push(body.length)
    body += obj
  }
  const xrefStart = body.length
  let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  for (let i = 1; i < offsets.length; i++) {
    xref += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`
  }
  const trailer = `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`
  const pdf = body + xref + trailer
  const blob = new Blob([pdf], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${data.referenceNumber}.pdf`
  link.click()
  URL.revokeObjectURL(url)
}
