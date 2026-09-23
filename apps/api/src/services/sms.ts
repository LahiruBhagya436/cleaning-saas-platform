interface SmsOptions {
  to:   string | null | undefined
  body: string
}

// SMS via 46elks (https://46elks.com).
// Dummy / no-op until FORTYSIX_ELKS_API_USERNAME and FORTYSIX_ELKS_API_PASSWORD
// are configured — falls back to console logging so the app keeps working
// without a paid SMS account (same pattern as the email service).
export async function sendSms({ to, body }: SmsOptions): Promise<void> {
  if (!to) {
    // eslint-disable-next-line no-console
    console.log('[SMS] skipped — recipient has no phone number')
    return
  }

  const username = process.env.FORTYSIX_ELKS_API_USERNAME
  const password = process.env.FORTYSIX_ELKS_API_PASSWORD
  const from     = process.env.SMS_FROM ?? 'CleaningCo'

  if (!username || !password) {
    // eslint-disable-next-line no-console
    console.log(`[SMS] (46elks not configured — logging instead) → ${to} | ${body}`)
    return
  }

  try {
    const auth = Buffer.from(`${username}:${password}`).toString('base64')
    const res = await fetch('https://api.46elks.com/a1/sms', {
      method:  'POST',
      headers: {
        Authorization:  `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ from, to, message: body }).toString(),
    })
    if (!res.ok) {
      // eslint-disable-next-line no-console
      console.error(`[SMS] 46elks error ${res.status}:`, await res.text())
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[SMS] Failed to send:', err)
  }
}
