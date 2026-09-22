export type PartyType = 'shared' | 'private' | 'family'

export type PartyTrip = {
  maxGuests?: number | null
  offersPrivatePackage?: boolean | null
  offersFamilyTrip?: boolean | null
  privatePackageGuests?: number | null
  privatePackagePrice?: number | null
  familyMaxGuests?: number | null
}

export type PartySettings = {
  privatePackageGuests?: number | null
  familyMaxGuests?: number | null
}

export function parsePartyType(value: unknown): PartyType {
  if (value === 'private' || value === 'family') return value
  return 'shared'
}

export function partyTypeLabel(partyType: PartyType) {
  if (partyType === 'private') return 'Private package'
  if (partyType === 'family') return 'Family trip'
  return 'Group trip'
}

export function getPartyOptions(trip: PartyTrip, settings?: PartySettings | null) {
  const privateGuests = Math.max(2, trip.privatePackageGuests ?? settings?.privatePackageGuests ?? 15)
  const familyMax = Math.max(2, trip.familyMaxGuests ?? settings?.familyMaxGuests ?? 8)
  return {
    offersPrivate: trip.offersPrivatePackage !== false,
    offersFamily: trip.offersFamilyTrip !== false,
    privateGuests,
    familyMax,
    privatePrice: trip.privatePackagePrice && trip.privatePackagePrice > 0 ? trip.privatePackagePrice : null,
  }
}

export function maxGuestsForParty(partyType: PartyType, trip: PartyTrip, settings?: PartySettings | null) {
  const options = getPartyOptions(trip, settings)
  if (partyType === 'private') return options.privateGuests
  if (partyType === 'family') return options.familyMax
  return Math.max(1, trip.maxGuests ?? 20)
}

export function quoteParty(input: {
  partyType: PartyType
  guestCount: number
  unitPrice: number
  addonTotal?: number
  trip: PartyTrip
  settings?: PartySettings | null
}) {
  const options = getPartyOptions(input.trip, input.settings)
  const guestCount = Math.max(1, Math.floor(input.guestCount) || 1)
  const addonTotal = input.addonTotal ?? 0
  const exclusive = input.partyType !== 'shared'
  const applyGroupDiscount = input.partyType === 'shared'

  if (input.partyType === 'private') {
    const basePrice = options.privatePrice ?? input.unitPrice * options.privateGuests
    return {
      guestCount,
      billedGuests: options.privateGuests,
      exclusive,
      applyGroupDiscount,
      maxGuests: options.privateGuests,
      basePrice,
      subtotal: basePrice + addonTotal,
    }
  }

  const basePrice = input.unitPrice * guestCount
  return {
    guestCount,
    billedGuests: guestCount,
    exclusive,
    applyGroupDiscount,
    maxGuests: input.partyType === 'family' ? options.familyMax : Math.max(1, input.trip.maxGuests ?? 20),
    basePrice,
    subtotal: basePrice + addonTotal,
  }
}
