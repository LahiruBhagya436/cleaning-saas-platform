import { Resend } from 'resend'

interface EmailOptions {
  to:       string
  template: string
  data:     Record<string, any>
}

const FROM_EMAIL = process.env.EMAIL_FROM ?? 'bookings@cleaningco.se'
const FROM_NAME  = process.env.EMAIL_FROM_NAME ?? 'Stockholm Cleaning Co.'
const FROM       = `${FROM_NAME} <${FROM_EMAIL}>`

const apiKey = process.env.RESEND_API_KEY
// Treat unset / placeholder keys as "not configured" so local dev keeps working
// without a real Resend account — falls back to console logging instead of
// throwing on every signup/booking/payment.
const isConfigured = !!apiKey && apiKey.startsWith('re_') && apiKey !== 're_...'
const resend = isConfigured ? new Resend(apiKey) : null

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function wrap(title: string, bodyHtml: string): string {
  return `
    <div style="font-family: -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #1a1a1a;">
      <div style="padding: 32px 0 8px; border-bottom: 2px solid #0C447C;">
        <span style="font-size: 18px; font-weight: 700; color: #0C447C;">Stockholm Cleaning Co.</span>
      </div>
      <div style="padding: 28px 0;">
        <h1 style="font-size: 20px; margin: 0 0 16px;">${escapeHtml(title)}</h1>
        ${bodyHtml}
      </div>
      <div style="padding: 20px 0; border-top: 1px solid #e5e5e5; font-size: 12px; color: #888;">
        Stockholm Cleaning Co. &middot; Detta är ett automatiskt utskick.
      </div>
    </div>
  `
}

interface Rendered {
  subject: string
  html:    string
}

function render(template: string, data: Record<string, any>): Rendered {
  switch (template) {
    case 'welcome':
      return {
        subject: `Välkommen, ${data.name}!`,
        html: wrap('Välkommen till Stockholm Cleaning Co.', `
          <p>Hej ${escapeHtml(data.name)},</p>
          <p>Tack för att du skapade ett konto hos oss. Du kan nu boka städningar, se dina fakturor och hantera RUT-avdrag direkt från ditt konto.</p>
        `),
      }

    case 'password_reset':
      return {
        subject: 'Återställ ditt lösenord',
        html: wrap('Återställ ditt lösenord', `
          <p>Hej ${escapeHtml(data.name)},</p>
          <p>Vi har fått en begäran om att återställa ditt lösenord. Klicka på knappen nedan för att välja ett nytt.</p>
          <p style="margin: 24px 0;">
            <a href="${escapeHtml(data.resetUrl)}" style="background: #0C447C; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">Återställ lösenord</a>
          </p>
          <p style="font-size: 13px; color: #666;">Länken är giltig i 1 timme. Om du inte begärde detta kan du ignorera mailet.</p>
        `),
      }

    case 'booking_confirmed':
      return {
        subject: `Din städning är bokad — ${data.dateLabel ?? ''}`,
        html: wrap('Din bokning är bekräftad', `
          <p>Hej ${escapeHtml(data.name)},</p>
          <p>Din städning är bokad och bekräftad.</p>
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px;">
            <tr><td style="padding: 6px 0; color: #666;">Datum</td><td style="padding: 6px 0; text-align: right;">${escapeHtml(data.dateLabel)}</td></tr>
            ${data.address ? `<tr><td style="padding: 6px 0; color: #666;">Adress</td><td style="padding: 6px 0; text-align: right;">${escapeHtml(data.address)}</td></tr>` : ''}
            ${data.staffName ? `<tr><td style="padding: 6px 0; color: #666;">Personal</td><td style="padding: 6px 0; text-align: right;">${escapeHtml(data.staffName)}</td></tr>` : '<tr><td style="padding: 6px 0; color: #666;">Personal</td><td style="padding: 6px 0; text-align: right;">Tilldelas snart</td></tr>'}
            ${data.customerPays != null ? `<tr><td style="padding: 6px 0; color: #666;">Att betala</td><td style="padding: 6px 0; text-align: right; font-weight: 600;">${escapeHtml(data.customerPays)} kr</td></tr>` : ''}
          </table>
          <p>Du hittar fullständiga detaljer på ditt konto under "Mina bokningar".</p>
        `),
      }

    case 'invoice':
      return {
        subject: `Faktura ${data.invoiceNumber} från Stockholm Cleaning Co.`,
        html: wrap('Ny faktura', `
          <p>Hej ${escapeHtml(data.name)},</p>
          <p>En ny faktura har skapats för din genomförda städning.</p>
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px;">
            <tr><td style="padding: 6px 0; color: #666;">Fakturanummer</td><td style="padding: 6px 0; text-align: right; font-family: monospace;">${escapeHtml(data.invoiceNumber)}</td></tr>
            <tr><td style="padding: 6px 0; color: #666;">Att betala</td><td style="padding: 6px 0; text-align: right; font-weight: 600;">${escapeHtml(data.customerPays)} kr</td></tr>
            <tr><td style="padding: 6px 0; color: #666;">Förfallodatum</td><td style="padding: 6px 0; text-align: right;">${escapeHtml(data.dueDate)}</td></tr>
          </table>
          <p>Logga in på ditt konto för att betala fakturan online.</p>
        `),
      }

    case 'team_invite':
      return {
        subject: `Du har fått ett konto hos Stockholm Cleaning Co.`,
        html: wrap('Välkommen till teamet', `
          <p>Hej ${escapeHtml(data.name)},</p>
          <p>Du har lagts till som <strong>${escapeHtml(data.role === 'coordinator' ? 'arbetsledare' : data.role === 'admin' ? 'administratör' : 'städare')}</strong> hos Stockholm Cleaning Co.</p>
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px;">
            <tr><td style="padding: 6px 0; color: #666;">E-post</td><td style="padding: 6px 0; text-align: right; font-family: monospace;">${escapeHtml(data.email)}</td></tr>
            <tr><td style="padding: 6px 0; color: #666;">Tillfälligt lösenord</td><td style="padding: 6px 0; text-align: right; font-family: monospace;">${escapeHtml(data.tempPassword)}</td></tr>
          </table>
          <p style="font-size: 13px; color: #666;">Logga in och byt lösenord så snart som möjligt.</p>
        `),
      }

    case 'payment_receipt':
      return {
        subject: `Betalningsbekräftelse — Faktura ${data.invoiceNumber}`,
        html: wrap('Tack för din betalning', `
          <p>Hej ${escapeHtml(data.name)},</p>
          <p>Vi har tagit emot din betalning. Här är ditt kvitto:</p>
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px;">
            <tr><td style="padding: 6px 0; color: #666;">Fakturanummer</td><td style="padding: 6px 0; text-align: right; font-family: monospace;">${escapeHtml(data.invoiceNumber)}</td></tr>
            <tr><td style="padding: 6px 0; color: #666;">Belopp betalt</td><td style="padding: 6px 0; text-align: right; font-weight: 600;">${escapeHtml(data.amountPaid)} kr</td></tr>
            <tr><td style="padding: 6px 0; color: #666;">Betalningsdatum</td><td style="padding: 6px 0; text-align: right;">${escapeHtml(data.paidDate)}</td></tr>
          </table>
          <p>Tack för att du valde Stockholm Cleaning Co.!</p>
        `),
      }

    default:
      return {
        subject: 'Stockholm Cleaning Co.',
        html: wrap(template, `<pre style="white-space: pre-wrap; font-size: 13px;">${escapeHtml(JSON.stringify(data, null, 2))}</pre>`),
      }
  }
}

export async function sendEmail({ to, template, data }: EmailOptions) {
  const { subject, html } = render(template, data)

  if (!resend) {
    console.log(`[Email] (RESEND_API_KEY not configured — logging instead) → ${to} | template: ${template}`)
    console.log('[Email] data:', JSON.stringify(data, null, 2))
    return { sent: false }
  }

  try {
    const result = await resend.emails.send({ from: FROM, to, subject, html })
    if (result.error) {
      console.error(`[Email] Resend error sending "${template}" to ${to}:`, result.error)
      return { sent: false, error: result.error }
    }
    return { sent: true, id: result.data?.id }
  } catch (err) {
    console.error(`[Email] Failed to send "${template}" to ${to}:`, err)
    return { sent: false, error: err }
  }
}
