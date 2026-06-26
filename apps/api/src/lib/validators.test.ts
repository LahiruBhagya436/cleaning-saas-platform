import { normalizePersonnummer } from './validators'

describe('normalizePersonnummer', () => {
  it('accepts a 10-digit number with a dash', () => {
    expect(normalizePersonnummer('850101-1234')).toBe('8501011234')
  })

  it('accepts a 10-digit number without a dash', () => {
    expect(normalizePersonnummer('8501011234')).toBe('8501011234')
  })

  it('strips the century prefix from a 12-digit number', () => {
    expect(normalizePersonnummer('198501011234')).toBe('8501011234')
  })

  it('accepts a 12-digit number with a dash', () => {
    expect(normalizePersonnummer('19850101-1234')).toBe('8501011234')
  })

  it('handles a coordination number plus sign', () => {
    expect(normalizePersonnummer('850101+1234')).toBe('8501011234')
  })

  it('returns null for an invalid length', () => {
    expect(normalizePersonnummer('12345')).toBeNull()
    expect(normalizePersonnummer('123456789012345')).toBeNull()
  })

  it('returns null for non-numeric garbage', () => {
    expect(normalizePersonnummer('not-a-number')).toBeNull()
  })

  it('returns null for an empty string', () => {
    expect(normalizePersonnummer('')).toBeNull()
  })
})
