import { createFileRoute, notFound, useNavigate } from '@tanstack/react-router'
import { Users } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { BackButton } from '~/components/back-button'
import { useLocale } from '~/components/locale-context'
import { PriceTag } from '~/components/price-tag'
import { WaitlistForm } from '~/components/waitlist-form'
import { PhoneInput } from '~/components/phone-input'
import { getGroupDiscount } from '~/lib/group-discount'
import { getPartyOptions, maxGuestsForParty, quoteParty, type PartyType } from '~/lib/party-package'
import { isValidEthiopianPhone } from '~/lib/phone'
import { formatPrice } from '~/lib/utils'
import { createBookingFn } from '~/server/bookings/functions'
import { getSiteSettingsFn } from '~/server/content/functions'
import { getTripFn } from '~/server/trips/functions'

export const Route = createFileRoute('/_site/trips/$slug/book/')({
  loader: async ({ params }) => {
    const [trip, settings] = await Promise.all([
      getTripFn({ data: { slug: params.slug } }),
      getSiteSettingsFn(),
    ])
    if (!trip) throw notFound()
    return { trip, settings }
  },
  component: BookTripPage,
})

function BookTripPage() {
  const { trip, settings } = Route.useLoaderData()
  const { slug } = Route.useParams()
  const { t } = useLocale()
  const navigate = useNavigate()

  const [travelDate, setTravelDate] = useState('')
  const [guestCount, setGuestCount] = useState(1)
  const [partyType, setPartyType] = useState<PartyType>('shared')
  const [addonIds, setAddonIds] = useState<string[]>([])
  const [promoCode, setPromoCode] = useState('')
  const [paymentType, setPaymentType] = useState<'full' | 'deposit'>('full')
  const [paymentMethod, setPaymentMethod] = useState('telebirr')
  const [acceptPolicy, setAcceptPolicy] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [phone, setPhone] = useState('')

  const partyOptions = getPartyOptions(trip, settings)
  const maxGuests = maxGuestsForParty(partyType, trip, settings)
  const selectedAvail = trip.availability.find((a) => a.date === travelDate)
  const unitPrice = selectedAvail?.priceOverride ?? trip.price
  const addonTotal = trip.addons
    .filter((a) => addonIds.includes(a.id))
    .reduce((sum, a) => sum + a.price, 0)
  const quote = quoteParty({
    partyType,
    guestCount,
    unitPrice,
    addonTotal,
    trip,
    settings,
  })
  const groupDiscount = quote.applyGroupDiscount
    ? getGroupDiscount(quote.subtotal, guestCount, settings)
    : { eligible: false, amount: 0, percent: 0, minGuests: 0, tiers: [], next: undefined }
  const totalPrice = Math.max(0, quote.subtotal - groupDiscount.amount)
  const depositPercent = trip.depositPercent ?? 30
  const depositAmount = Math.round(totalPrice * (depositPercent / 100))
  const payAmount = paymentType === 'deposit' ? depositAmount : totalPrice

  const today = new Date().toISOString().slice(0, 10)
  const availableDates = trip.availability
    .filter((a) => {
      if (a.date < today) return false
      if (partyType === 'shared') return a.spotsRemaining >= guestCount
      return Boolean((a as { exclusiveOpen?: boolean }).exclusiveOpen)
    })
    .sort((a, b) => a.date.localeCompare(b.date))

  const toggleAddon = (id: string) => {
    setAddonIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    const form = new FormData(e.currentTarget)
    const phoneValue = phone || String(form.get('phone') || '')
    if (!isValidEthiopianPhone(phoneValue)) {
      setError(t('invalidPhone'))
      return
    }
    setSubmitting(true)
    try {
      const result = await createBookingFn({
        data: {
          tripId: trip.id,
          customerName: String(form.get('customerName') || ''),
          email: String(form.get('email') || ''),
          phone: phoneValue,
          travelDate,
          guestCount,
          partyType,
          notes: String(form.get('notes') || '') || undefined,
          addonIds: addonIds.length ? addonIds : undefined,
          promoCode: promoCode || undefined,
          paymentType,
          paymentMethod,
          acceptPolicy,
        },
      })

      if (!result.ok) {
        const messages: Record<string, string> = {
          POLICY_REQUIRED: t('acceptPolicy'),
          TRIP_NOT_FOUND: t('noTripsFound'),
          NO_AVAILABILITY: 'Not enough spots left on that date.',
          EXCLUSIVE_UNAVAILABLE: t('exclusiveDateClosed'),
          PACKAGE_UNAVAILABLE: t('error'),
          FAMILY_TOO_LARGE: t('familyTripHint', { n: partyOptions.familyMax }),
          TOO_MANY_GUESTS: t('error'),
          INVALID_PHONE: t('invalidPhone'),
          INVALID_EMAIL: t('invalidEmail'),
          INVALID_EMAIL_DOMAIN: t('invalidEmailDomain'),
          BOOKING_FAILED: t('error'),
        }
        setError(messages[result.error] || t('error'))
        return
      }

      navigate({
        to: '/trips/$slug/book/confirm',
        params: { slug },
        search: { ref: result.booking.referenceNumber },
      })
    } catch {
      setError(t('error'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <BackButton fallbackTo={`/trips/${slug}`} label={trip.title} />
      <h1 className="mt-4 font-display text-3xl font-bold">{t('bookThisTrip')}</h1>
      {availableDates.length === 0 && (
        <div className="mt-6">
          <p className="text-sm text-muted">{t('joinWaitlist')}</p>
          <WaitlistForm tripId={trip.id} dates={trip.availability} />
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <div className="card p-6">
          <p className="label">How do you want to travel?</p>
          <div className="mt-2 grid gap-3">
            <label className="flex cursor-pointer gap-3 rounded-xl border border-border p-3 has-[:checked]:border-primary has-[:checked]:bg-emerald-50">
              <input
                type="radio"
                name="partyType"
                className="mt-1"
                checked={partyType === 'shared'}
                onChange={() => {
                  setPartyType('shared')
                  setTravelDate('')
                }}
              />
              <span>
                <span className="block font-medium">{t('joinGroupTrip')}</span>
                <span className="text-sm text-muted">{t('joinGroupTripHint')}</span>
              </span>
            </label>
            {partyOptions.offersPrivate ? (
              <label className="flex cursor-pointer gap-3 rounded-xl border border-border p-3 has-[:checked]:border-primary has-[:checked]:bg-emerald-50">
                <input
                  type="radio"
                  name="partyType"
                  className="mt-1"
                  checked={partyType === 'private'}
                  onChange={() => {
                    setPartyType('private')
                    setTravelDate('')
                    setGuestCount((n) => Math.min(n, partyOptions.privateGuests))
                  }}
                />
                <span>
                  <span className="block font-medium">{t('privatePackage')}</span>
                  <span className="text-sm text-muted">{t('privatePackageHint', { n: partyOptions.privateGuests })}</span>
                </span>
              </label>
            ) : null}
            {partyOptions.offersFamily ? (
              <label className="flex cursor-pointer gap-3 rounded-xl border border-border p-3 has-[:checked]:border-primary has-[:checked]:bg-emerald-50">
                <input
                  type="radio"
                  name="partyType"
                  className="mt-1"
                  checked={partyType === 'family'}
                  onChange={() => {
                    setPartyType('family')
                    setTravelDate('')
                    setGuestCount((n) => Math.min(n, partyOptions.familyMax))
                  }}
                />
                <span>
                  <span className="block font-medium">{t('familyTrip')}</span>
                  <span className="text-sm text-muted">{t('familyTripHint', { n: partyOptions.familyMax })}</span>
                </span>
              </label>
            ) : null}
          </div>
        </div>

        <div className="card p-6">
          <label className="label" htmlFor="travelDate">
            {t('selectDate')}
          </label>
          <select
            id="travelDate"
            required
            value={travelDate}
            onChange={(e) => setTravelDate(e.target.value)}
            className="input"
          >
            <option value="">—</option>
            {availableDates.map((a) => (
              <option key={a.id} value={a.date}>
                {a.date} ({a.spotsRemaining} {t('spotsLeft')})
              </option>
            ))}
          </select>
          {availableDates.length === 0 && (
            <p className="mt-2 text-sm text-destructive">No upcoming dates with enough spots.</p>
          )}

          <label className="label mt-4" htmlFor="guestCount">
            {t('guests')}
          </label>
          <input
            id="guestCount"
            type="number"
            min={1}
            max={maxGuests}
            required
            value={guestCount}
            onChange={(e) => setGuestCount(Number(e.target.value))}
            className="input"
          />
          {partyType === 'shared' ? (
          <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
            <p className="flex items-center gap-2 font-medium">
              <Users className="h-4 w-4" />
              Group discount
            </p>
            <ul className="mt-1 list-disc pl-5 text-emerald-800/90">
              {groupDiscount.tiers.map((tier) => (
                <li key={tier.minGuests}>
                  {tier.percent}% off for {tier.minGuests}+ guests
                </li>
              ))}
            </ul>
            {groupDiscount.eligible ? (
              <p className="mt-1">
                You qualify for {groupDiscount.percent}% off. Saving {formatPrice(groupDiscount.amount)} on this
                booking.
              </p>
            ) : groupDiscount.next ? (
              <p className="mt-1 text-emerald-800/80">
                Add {groupDiscount.next.minGuests - guestCount} more{' '}
                {groupDiscount.next.minGuests - guestCount === 1 ? 'guest' : 'guests'} to unlock{' '}
                {groupDiscount.next.percent}% off.
              </p>
            ) : null}
            {groupDiscount.eligible && groupDiscount.next ? (
              <p className="mt-1 text-emerald-800/80">
                Add {groupDiscount.next.minGuests - guestCount} more{' '}
                {groupDiscount.next.minGuests - guestCount === 1 ? 'guest' : 'guests'} to unlock{' '}
                {groupDiscount.next.percent}% off.
              </p>
            ) : null}
          </div>
          ) : (
            <p className="mt-3 rounded-xl border border-primary/20 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
              {partyType === 'private'
                ? `You pay for ${partyOptions.privateGuests} seats (${formatPrice(quote.basePrice)}). This date will not be offered to other travelers.`
                : 'This date is for your family only. Other travelers cannot join.'}
            </p>
          )}
        </div>

        <div className="card p-6">
          <label className="label" htmlFor="customerName">
            {t('fullName')}
          </label>
          <input id="customerName" name="customerName" required className="input" />

          <label className="label mt-4" htmlFor="email">
            {t('email')}
          </label>
          <input id="email" name="email" type="email" required className="input" />

          <label className="label mt-4" htmlFor="phone">
            {t('phone')}
          </label>
          <PhoneInput id="phone" name="phone" required value={phone} onChange={setPhone} />

          <label className="label mt-4" htmlFor="notes">
            {t('specialRequests')}
          </label>
          <textarea id="notes" name="notes" rows={3} className="input" />
        </div>

        {trip.addons.length > 0 && (
          <div className="card p-6">
            <h2 className="font-semibold">{t('addons')}</h2>
            <div className="mt-3 space-y-2">
              {trip.addons.map((addon) => (
                <label key={addon.id} className="flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={addonIds.includes(addon.id)}
                    onChange={() => toggleAddon(addon.id)}
                    className="h-4 w-4 rounded border-border"
                  />
                  <span className="flex-1 text-sm">
                    {addon.name}
                    {addon.description && (
                      <span className="block text-muted">{addon.description}</span>
                    )}
                  </span>
                  <span className="text-sm font-medium">{formatPrice(addon.price)}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="card p-6">
          <label className="label" htmlFor="promoCode">
            {t('promoCode')}
          </label>
          <input
            id="promoCode"
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
            className="input"
            placeholder="SAVE10"
          />
        </div>

        <div className="card p-6">
          <h2 className="font-semibold">{t('paymentType')}</h2>
          <div className="mt-3 space-y-2">
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="radio"
                name="paymentType"
                checked={paymentType === 'full'}
                onChange={() => setPaymentType('full')}
              />
              <span className="text-sm">
                {t('payFull')} — <PriceTag etb={totalPrice} size="sm" />
              </span>
            </label>
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="radio"
                name="paymentType"
                checked={paymentType === 'deposit'}
                onChange={() => setPaymentType('deposit')}
              />
              <span className="text-sm">
                {t('payDeposit')} ({depositPercent}%) — <PriceTag etb={depositAmount} size="sm" />
              </span>
            </label>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="font-semibold">{t('paymentMethod')}</h2>
          <div className="mt-3 space-y-2">
            {[
              { value: 'telebirr', label: t('telebirr') },
              { value: 'bank_transfer', label: t('bankTransfer') },
              { value: 'pay_on_arrival', label: t('payOnArrival') },
            ].map((method) => (
              <label key={method.value} className="flex cursor-pointer items-center gap-3">
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={paymentMethod === method.value}
                  onChange={() => setPaymentMethod(method.value)}
                />
                <span className="text-sm">{method.label}</span>
              </label>
            ))}
          </div>
          {paymentMethod !== 'pay_on_arrival' && (
            <p className="mt-3 text-sm text-muted">{t('paymentProofRequired')}</p>
          )}
        </div>

        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            required
            checked={acceptPolicy}
            onChange={(e) => setAcceptPolicy(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-border"
          />
          <span className="text-sm">{t('acceptPolicy')}</span>
        </label>

        {error && (
          <p className="rounded-lg bg-destructive/10 px-4 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="card flex flex-wrap items-center justify-between gap-3 p-6">
          <div>
            <p className="text-sm text-muted">{t('price')}</p>
            {groupDiscount.eligible && (
              <p className="text-sm text-muted line-through">{formatPrice(quote.subtotal)}</p>
            )}
            <p className="text-2xl font-bold text-price">
              <PriceTag etb={payAmount} size="lg" />
            </p>
            {groupDiscount.eligible && (
              <p className="text-xs text-emerald-700">
                Includes {groupDiscount.percent}% group discount (−{formatPrice(groupDiscount.amount)})
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <BackButton fallbackTo={`/trips/${slug}`} label={t('back')} />
            <button type="submit" disabled={submitting || !travelDate} className="btn-primary">
              {submitting ? t('loading') : t('submitBooking')}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
