import { Link, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { useLocale } from '~/components/locale-context'
import { qrImageUrl } from '~/lib/export'
import { needsPaymentProof } from '~/lib/payments'
import { cn, formatPrice } from '~/lib/utils'
import { uploadPaymentProofFn } from '~/server/bookings/functions'

type PaymentProofUploadProps = {
  referenceNumber: string
  paymentMethod?: string | null
  paymentStatus?: string | null
  paymentProofUrl?: string | null
  payAmount: number
  telebirrNumber?: string | null
  telebirrQrUrl?: string | null
  bankName?: string | null
  bankAccount?: string | null
  bankQrUrl?: string | null
  className?: string
  /** checkout = after upload they finish and leave; manage = can replace screenshot */
  variant?: 'checkout' | 'manage'
}

export function PaymentProofUpload({
  referenceNumber,
  paymentMethod,
  paymentStatus,
  paymentProofUrl,
  payAmount,
  telebirrNumber,
  telebirrQrUrl,
  bankName,
  bankAccount,
  bankQrUrl,
  className,
  variant = 'manage',
}: PaymentProofUploadProps) {
  const { t } = useLocale()
  const router = useRouter()
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState(paymentProofUrl || '')

  if (!needsPaymentProof(paymentMethod)) return null

  const paid = paymentStatus === 'paid'
  const hasProof = Boolean(preview)
  const checkoutDone = variant === 'checkout' && hasProof

  const onFile = async (file?: File) => {
    if (!file) return
    setError('')
    setUploading(true)
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result))
        reader.onerror = () => reject(new Error('read'))
        reader.readAsDataURL(file)
      })
      const result = await uploadPaymentProofFn({
        data: { referenceNumber, dataUrl },
      })
      if (!result.ok) {
        setError(t('error'))
        return
      }
      setPreview(result.url)
      await router.invalidate()
    } catch {
      setError(t('error'))
    } finally {
      setUploading(false)
    }
  }

  if (checkoutDone) {
    return (
      <div className={cn('space-y-4 text-center print:hidden', className ?? 'card mt-6 p-6')}>
        {preview && (
          <img
            src={preview}
            alt={t('paymentProof')}
            className="mx-auto max-h-48 rounded-xl border border-border object-contain bg-accent"
          />
        )}
        <p className="text-sm text-emerald-800">{t('proofReceived')}</p>
        <p className="text-sm text-muted">{t('bookingCompleteHint')}</p>
        <Link to="/trips" className="btn-primary inline-flex">
          {t('exploreTrips')}
        </Link>
      </div>
    )
  }

  return (
    <div className={cn('space-y-4 print:hidden', className ?? 'card mt-6 p-6')}>
      <h2 className="font-display text-xl font-semibold">{t('payNow')}</h2>
      <p className="text-sm text-muted">{t('paymentProofRequired')}</p>
      <p className="text-lg font-bold text-price">{formatPrice(payAmount)}</p>

      {paymentMethod === 'telebirr' && (
        <div className="rounded-xl border border-border bg-accent/40 p-4">
          <p className="text-sm font-semibold">{t('howToPay')}</p>
          <p className="mt-1 text-sm">
            <span className="text-muted">{t('sendPaymentTo')} </span>
            <strong>{t('telebirr')}</strong>
            {telebirrNumber ? `: ${telebirrNumber}` : ''}
          </p>
          {(telebirrQrUrl || telebirrNumber) && (
            <img
              src={telebirrQrUrl || qrImageUrl(telebirrNumber || '')}
              alt={t('scanToPay')}
              className="mx-auto mt-3 h-48 w-48 rounded-xl border border-border bg-white p-2"
            />
          )}
          <p className="mt-2 text-center text-xs text-muted">{t('scanToPay')}</p>
        </div>
      )}
      {paymentMethod === 'bank_transfer' && (
        <div className="rounded-xl border border-border bg-accent/40 p-4">
          <p className="text-sm font-semibold">{t('howToPay')}</p>
          <p className="mt-1 text-sm">
            <span className="text-muted">{t('sendPaymentTo')} </span>
            <strong>{t('bankTransfer')}</strong>
            {bankName || bankAccount ? `: ${[bankName, bankAccount].filter(Boolean).join(' · ')}` : ''}
          </p>
          {(bankQrUrl || bankAccount) && (
            <img
              src={bankQrUrl || qrImageUrl([bankName, bankAccount].filter(Boolean).join(' '))}
              alt={t('howToPay')}
              className="mx-auto mt-3 h-48 w-48 rounded-xl border border-border bg-white p-2"
            />
          )}
        </div>
      )}
      <p className="text-sm text-muted">{t('includeReference')}</p>
      <p className="font-mono text-sm font-semibold">{referenceNumber}</p>

      {preview && (
        <a href={preview} target="_blank" rel="noreferrer" className="block">
          <img
            src={preview}
            alt={t('paymentProof')}
            className="max-h-64 w-full rounded-xl border border-border object-contain bg-accent"
          />
        </a>
      )}

      {hasProof && !paid && <p className="text-sm text-emerald-800">{t('proofReceived')}</p>}
      {paid && <p className="text-sm font-medium text-emerald-800">{t('bookingConfirmed')}</p>}

      {!paid && (
        <label className="btn-primary inline-flex cursor-pointer">
          {uploading ? t('loading') : hasProof ? t('replacePaymentProof') : t('uploadPaymentProof')}
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
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
