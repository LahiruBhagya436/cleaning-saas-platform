import crypto from 'crypto'

// ── Field-level encryption for sensitive PII (e.g. personnummer, access codes) ──
//
// Uses AES-256-GCM. The configured ENCRYPTION_KEY can be any string (we hash it
// with SHA-256 to always derive exactly 32 bytes) so there's no risk of a
// misconfigured key length blowing up in production.

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12
const AUTH_TAG_LENGTH = 16

function getKey(): Buffer {
  const secret = process.env.ENCRYPTION_KEY
  if (!secret || secret.includes('change-me') || secret === '32-char-hex-key-for-field-encryption') {
    throw new Error('ENCRYPTION_KEY is not configured. Set a real secret in your environment.')
  }
  return crypto.createHash('sha256').update(secret).digest()
}

/** Encrypts a plaintext string. Returns a base64 payload safe to store in a String column. */
export function encryptField(plaintext: string): string {
  const key = getKey()
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  return Buffer.concat([iv, authTag, encrypted]).toString('base64')
}

/** Decrypts a payload produced by encryptField. Throws if the key is wrong or data is corrupt. */
export function decryptField(payload: string): string {
  const key = getKey()
  const buf = Buffer.from(payload, 'base64')
  const iv = buf.subarray(0, IV_LENGTH)
  const authTag = buf.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH)
  const encrypted = buf.subarray(IV_LENGTH + AUTH_TAG_LENGTH)
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()])
  return decrypted.toString('utf8')
}

/** Masks a Swedish personnummer for display, e.g. "9001011234" -> "••••••1234". */
export function maskPersonnummer(plaintext: string): string {
  const digits = plaintext.replace(/\D/g, '')
  if (digits.length < 4) return '••••'
  return `••••••${digits.slice(-4)}`
}
