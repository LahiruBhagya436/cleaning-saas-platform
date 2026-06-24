/**
 * Normalizes a Swedish personnummer to a canonical 10-digit form (YYMMDD-XXXX
 * stored without the dash, i.e. "YYMMDDXXXX"). Accepts input with or without
 * dashes/plus signs and with or without the century prefix.
 * Returns null if the input doesn't look like a valid personnummer.
 */
export function normalizePersonnummer(input: string): string | null {
  const digits = input.replace(/[^\d]/g, '')

  if (digits.length === 10) {
    return digits
  }
  if (digits.length === 12) {
    // Strip the century prefix (YYYY -> YY)
    return digits.slice(2)
  }
  return null
}
