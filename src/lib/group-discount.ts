export type GroupDiscountSettings = {
  groupDiscountSmallMinGuests?: number | null
  groupDiscountSmallPercent?: number | null
  groupDiscountMinGuests?: number | null
  groupDiscountPercent?: number | null
}

export type GroupDiscountTier = {
  minGuests: number
  percent: number
}

export function getGroupDiscountTiers(settings?: GroupDiscountSettings | null): GroupDiscountTier[] {
  const raw: GroupDiscountTier[] = [
    {
      minGuests: settings?.groupDiscountSmallMinGuests ?? 5,
      percent: settings?.groupDiscountSmallPercent ?? 5,
    },
    {
      minGuests: settings?.groupDiscountMinGuests ?? 10,
      percent: settings?.groupDiscountPercent ?? 10,
    },
  ]
  const byMin = new Map<number, GroupDiscountTier>()
  for (const tier of raw) {
    if (tier.minGuests < 2 || tier.percent <= 0) continue
    const prev = byMin.get(tier.minGuests)
    if (!prev || tier.percent > prev.percent) byMin.set(tier.minGuests, tier)
  }
  return [...byMin.values()].sort((a, b) => a.minGuests - b.minGuests)
}

export function formatGroupDiscountSummary(settings?: GroupDiscountSettings | null) {
  const tiers = getGroupDiscountTiers(settings)
  if (tiers.length === 0) return 'No group discount is set.'
  return tiers.map((tier) => `${tier.percent}% off for ${tier.minGuests}+ guests`).join(' · ')
}

export function getGroupDiscount(subtotal: number, guestCount: number, settings?: GroupDiscountSettings | null) {
  const tiers = getGroupDiscountTiers(settings)
  const applied = [...tiers].reverse().find((tier) => guestCount >= tier.minGuests)
  const next = tiers.find((tier) => guestCount < tier.minGuests)
  const minGuests = applied?.minGuests ?? tiers[0]?.minGuests ?? 5
  const percent = applied?.percent ?? 0
  const eligible = Boolean(applied) && subtotal > 0 && percent > 0

  return {
    eligible,
    minGuests,
    percent,
    amount: eligible ? Math.round(subtotal * (percent / 100)) : 0,
    tiers,
    next,
  }
}
