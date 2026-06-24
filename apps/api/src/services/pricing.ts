import { Service } from '@prisma/client'

export interface PricingResult {
  totalExclVat:      number
  vatAmount:         number
  rutEligibleLabour: number
  rutDeduction:      number
  customerPays:      number
}

const VAT_RATE = 0.25
const RUT_RATE = 0.5
const RUT_CAP  = 75000

export function calculateBookingPrice(
  services: Pick<Service, 'basePricePerHour' | 'rutEligible' | 'vatRate'>[],
  durationMinutes: number,
  customerRutUsed = 0
): PricingResult {
  const hours = durationMinutes / 60

  const totalHourlyRate = services.reduce((sum, s) => sum + Number(s.basePricePerHour), 0)
  const labourExclVat   = +(totalHourlyRate * hours).toFixed(2)
  const vatAmount       = +(labourExclVat * VAT_RATE).toFixed(2)
  const totalInclVat    = +(labourExclVat + vatAmount).toFixed(2)

  const rutEligibleRate    = services.filter(s => s.rutEligible).reduce((sum, s) => sum + Number(s.basePricePerHour), 0)
  const rutEligibleLabour  = +(rutEligibleRate * hours).toFixed(2)
  const rutEligibleInclVat = +(rutEligibleLabour * (1 + VAT_RATE)).toFixed(2)
  const rutRemaining       = Math.max(0, RUT_CAP - customerRutUsed)
  const rutDeduction       = +Math.min(rutEligibleInclVat * RUT_RATE, rutRemaining).toFixed(2)
  const customerPays       = +(totalInclVat - rutDeduction).toFixed(2)

  return { totalExclVat: labourExclVat, vatAmount, rutEligibleLabour, rutDeduction, customerPays }
}
