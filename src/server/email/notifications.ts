import { sendEmail } from './transport'

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function layout(title: string, body: string) {
  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:24px;background:#f4f1ea;font-family:Arial,sans-serif;color:#1f2937;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;padding:28px;border:1px solid #e5e7eb;">
    <p style="margin:0 0 16px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#166534;">Trip Explorer</p>
    <h1 style="margin:0 0 16px;font-size:22px;">${escapeHtml(title)}</h1>
    ${body}
    <p style="margin:24px 0 0;font-size:12px;color:#6b7280;">WhatsApp / phone: 0974332069</p>
  </div>
</body>
</html>`
}

export async function sendBookingNotificationToAdmin(data: {
  adminEmail: string
  referenceNumber: string
  tripTitle: string
  customerName: string
  email: string
  travelDate: string
  guestCount: number
  partyType?: string
  totalPrice: number
}) {
  const packageLine = data.partyType && data.partyType !== 'shared' ? `\nPackage: ${data.partyType}` : ''
  const text = `New booking ${data.referenceNumber}\nTrip: ${data.tripTitle}\nCustomer: ${data.customerName} (${data.email})\nDate: ${data.travelDate}\nGuests: ${data.guestCount}${packageLine}\nTotal: ETB ${data.totalPrice}`
  return sendEmail({
    to: data.adminEmail,
    subject: `New Booking: ${data.referenceNumber}`,
    text,
    replyTo: data.email,
    html: layout(
      `New booking ${data.referenceNumber}`,
      `<p><strong>Trip:</strong> ${escapeHtml(data.tripTitle)}</p>
       <p><strong>Customer:</strong> ${escapeHtml(data.customerName)} (${escapeHtml(data.email)})</p>
       <p><strong>Date:</strong> ${escapeHtml(data.travelDate)}</p>
       <p><strong>Guests:</strong> ${data.guestCount}${data.partyType && data.partyType !== 'shared' ? ` (${escapeHtml(data.partyType)})` : ''}</p>
       <p><strong>Total:</strong> ETB ${data.totalPrice}</p>`,
    ),
  })
}

export async function sendBookingConfirmationToCustomer(data: {
  email: string
  referenceNumber: string
  tripTitle: string
  travelDate: string
  totalPrice: number
}) {
  return sendEmail({
    to: data.email,
    subject: `Booking Confirmed: ${data.referenceNumber}`,
    text: `Your booking ${data.referenceNumber} is confirmed!\nTrip: ${data.tripTitle}\nDate: ${data.travelDate}\nTotal: ETB ${data.totalPrice}`,
    html: layout(
      'Booking confirmed',
      `<p>Reference: <strong>${escapeHtml(data.referenceNumber)}</strong></p>
       <p>Trip: ${escapeHtml(data.tripTitle)}</p>
       <p>Date: ${escapeHtml(data.travelDate)}</p>
       <p>Total: ETB ${data.totalPrice}</p>
       <p>We will follow up on WhatsApp if we need anything else.</p>`,
    ),
  })
}

export async function sendPaymentReceivedToCustomer(data: {
  email: string
  customerName: string
  referenceNumber: string
  tripTitle: string
  travelDate: string
  totalPrice: number
}) {
  const name = data.customerName.trim() || 'there'
  return sendEmail({
    to: data.email,
    subject: `Payment received: ${data.referenceNumber}`,
    text: `Hi ${name},\n\nWe received your payment. Booking ${data.referenceNumber} is confirmed.\nTrip: ${data.tripTitle}\nDate: ${data.travelDate}\nTotal: ETB ${data.totalPrice}\n\nSee you on the trip!`,
    html: layout(
      'Payment received',
      `<p>Hi ${escapeHtml(name)},</p>
       <p>We received your payment. Your booking is confirmed.</p>
       <p>Reference: <strong>${escapeHtml(data.referenceNumber)}</strong></p>
       <p>Trip: ${escapeHtml(data.tripTitle)}</p>
       <p>Date: ${escapeHtml(data.travelDate)}</p>
       <p>Total: ETB ${data.totalPrice.toLocaleString()}</p>
       <p>See you on the trip. We will follow up on WhatsApp if we need anything else.</p>`,
    ),
  })
}

export async function sendChannelAlertToAdmin(data: {
  adminEmail: string
  channel: string
  name: string
  from: string
  message: string
}) {
  return sendEmail({
    to: data.adminEmail,
    subject: `${data.channel}: ${data.name}`,
    text: `${data.channel} from ${data.name} (${data.from})\n\n${data.message}`,
    html: layout(
      data.channel,
      `<p><strong>From:</strong> ${escapeHtml(data.name)} (${escapeHtml(data.from)})</p>
       <p style="white-space:pre-wrap;">${escapeHtml(data.message)}</p>`,
    ),
  })
}

export async function sendContactNotification(data: {
  adminEmail: string
  name: string
  email: string
  subject: string
  message: string
}) {
  return sendEmail({
    to: data.adminEmail,
    subject: `Contact: ${data.subject}`,
    text: `From: ${data.name} (${data.email})\n\n${data.message}`,
    replyTo: data.email,
    html: layout(
      data.subject,
      `<p><strong>From:</strong> ${escapeHtml(data.name)} (${escapeHtml(data.email)})</p>
       <p style="white-space:pre-wrap;">${escapeHtml(data.message)}</p>`,
    ),
  })
}

export async function sendTripDayReminderEmail(data: {
  email: string
  customerName: string
  tripTitle: string
  travelDate: string
  referenceNumber: string
}) {
  const name = data.customerName.trim() || 'there'
  return sendEmail({
    to: data.email,
    subject: `Tomorrow: ${data.tripTitle}`,
    text: `Hi ${name},\n\nThis is a reminder that your trip is tomorrow.\nTrip: ${data.tripTitle}\nDate: ${data.travelDate}\nReference: ${data.referenceNumber}\n\nSee you then!`,
    html: layout(
      'Your trip is tomorrow',
      `<p>Hi ${escapeHtml(name)},</p>
       <p>This is a reminder that your trip is <strong>tomorrow</strong>.</p>
       <p>Trip: ${escapeHtml(data.tripTitle)}</p>
       <p>Date: ${escapeHtml(data.travelDate)}</p>
       <p>Reference: <strong>${escapeHtml(data.referenceNumber)}</strong></p>
       <p>See you then!</p>`,
    ),
  })
}

export async function sendPasswordResetEmail(data: { to: string; resetUrl: string }) {
  return sendEmail({
    to: data.to,
    subject: 'Reset your password',
    text: `Reset your password: ${data.resetUrl}`,
    html: layout(
      'Reset your password',
      `<p>We received a request to reset your Trip Explorer password.</p>
       <p><a href="${escapeHtml(data.resetUrl)}" style="display:inline-block;background:#166534;color:#fff;padding:10px 18px;border-radius:999px;text-decoration:none;">Reset password</a></p>
       <p>If you did not ask for this, you can ignore this email.</p>`,
    ),
  })
}

export async function sendNewsletterSignupToAdmin(data: { adminEmail: string; email: string }) {
  return sendEmail({
    to: data.adminEmail,
    subject: 'New newsletter subscriber',
    text: `${data.email} subscribed to the newsletter.`,
    html: layout('New newsletter subscriber', `<p>${escapeHtml(data.email)}</p>`),
  })
}

export async function sendLoginSuccessEmail(data: { to: string; fullName?: string | null }) {
  const when = new Date().toLocaleString('en-GB', {
    timeZone: 'Africa/Addis_Ababa',
    dateStyle: 'medium',
    timeStyle: 'short',
  })
  const name = data.fullName?.trim() || 'there'
  return sendEmail({
    to: data.to,
    subject: 'Successful login to Trip Explorer',
    text: `Hi ${name},\n\nYou signed in to Trip Explorer successfully on ${when} (Ethiopia time).\n\nIf this was not you, reset your password immediately.`,
    html: layout(
      'Successful login',
      `<p>Hi ${escapeHtml(name)},</p>
       <p>You signed in to <strong>Trip Explorer</strong> successfully.</p>
       <p><strong>Time:</strong> ${escapeHtml(when)} (Ethiopia time)</p>
       <p>If this was not you, reset your password right away.</p>`,
    ),
  })
}

export async function sendEmailVerificationCode(data: { to: string; code: string }) {
  return sendEmail({
    to: data.to,
    subject: 'Your Trip Explorer verification code',
    text: `Your verification code is ${data.code}. It expires in 15 minutes.`,
    html: layout(
      'Verify your email',
      `<p>Use this code to finish creating your account:</p>
       <p style="font-size:28px;letter-spacing:.2em;font-weight:bold;">${escapeHtml(data.code)}</p>
       <p>This code expires in 15 minutes. If you did not sign up, ignore this email.</p>`,
    ),
  })
}

export async function sendAnnouncementEmail(data: {
  to: string
  subject: string
  message: string
  linkUrl?: string
  linkLabel?: string
}) {
  const linkHtml = data.linkUrl
    ? `<p><a href="${escapeHtml(data.linkUrl)}" style="display:inline-block;background:#166534;color:#fff;padding:10px 18px;border-radius:999px;text-decoration:none;">${escapeHtml(data.linkLabel || 'View details')}</a></p>`
    : ''
  const linkText = data.linkUrl ? `\n${data.linkLabel || 'View details'}: ${data.linkUrl}` : ''
  return sendEmail({
    to: data.to,
    subject: data.subject,
    text: `${data.message}${linkText}`,
    html: layout(data.subject, `<p style="white-space:pre-wrap;">${escapeHtml(data.message)}</p>${linkHtml}`),
  })
}
