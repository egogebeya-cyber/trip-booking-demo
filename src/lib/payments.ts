export type PaymentMethodType = 'telebirr' | 'bank' | 'cod'

export const PAYMENT_METHODS: { type: PaymentMethodType; label: string; emoji: string }[] = [
  { type: 'telebirr', label: 'Telebirr', emoji: '📱' },
  { type: 'bank', label: 'Bank Transfer', emoji: '🏛️' },
  { type: 'cod', label: 'Pay on Arrival', emoji: '💵' },
]

export function getPaymentLabel(type: PaymentMethodType) {
  return PAYMENT_METHODS.find((m) => m.type === type)?.label ?? type
}

export function needsPaymentProof(method?: string | null) {
  return method === 'telebirr' || method === 'bank_transfer'
}
