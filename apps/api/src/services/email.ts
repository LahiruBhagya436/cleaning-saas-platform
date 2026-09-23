import { Resend } from 'resend'

interface EmailOptions {
  to:       string
  template: string
  data:     Record<string, unknown>
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
        Stockholm Cleaning Co. &middot; This is an automated message.
      </div>
    </div>
  `
}

interface Rendered {
  subject: string
  html:    string
}

function render(template: string, data: Record<string, unknown>): Rendered {
  switch (template) {
    case 'welcome':
      return {
        subject: `Welcome, ${data.name}!`,
        html: wrap('Welcome to Stockholm Cleaning Co.', `
          <p>Hi ${escapeHtml(data.name)},</p>
          <p>Thank you for creating an account with us. You can now book cleanings, view your invoices, and manage RUT deductions directly from your account.</p>
        `),
      }

    case 'password_reset':
      return {
        subject: 'Reset your password',
        html: wrap('Reset your password', `
          <p>Hi ${escapeHtml(data.name)},</p>
          <p>We received a request to reset your password. Click the button below to choose a new one.</p>
          <p style="margin: 24px 0;">
            <a href="${escapeHtml(data.resetUrl)}" style="background: #0C447C; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">Reset password</a>
          </p>
          <p style="font-size: 13px; color: #666;">The link is valid for 1 hour. If you did not request this, you can ignore this email.</p>
        `),
      }

    case 'booking_confirmed':
      return {
        subject: `Your cleaning is booked — ${data.dateLabel ?? ''}`,
        html: wrap('Your booking is confirmed', `
          <p>Hi ${escapeHtml(data.name)},</p>
          <p>Your cleaning is booked and confirmed.</p>
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px;">
            <tr><td style="padding: 6px 0; color: #666;">Date</td><td style="padding: 6px 0; text-align: right;">${escapeHtml(data.dateLabel)}</td></tr>
            ${data.address ? `<tr><td style="padding: 6px 0; color: #666;">Address</td><td style="padding: 6px 0; text-align: right;">${escapeHtml(data.address)}</td></tr>` : ''}
            ${data.staffName ? `<tr><td style="padding: 6px 0; color: #666;">Staff</td><td style="padding: 6px 0; text-align: right;">${escapeHtml(data.staffName)}</td></tr>` : '<tr><td style="padding: 6px 0; color: #666;">Staff</td><td style="padding: 6px 0; text-align: right;">To be assigned</td></tr>'}
            ${data.customerPays != null ? `<tr><td style="padding: 6px 0; color: #666;">To pay</td><td style="padding: 6px 0; text-align: right; font-weight: 600;">${escapeHtml(data.customerPays)} kr</td></tr>` : ''}
          </table>
          <p>You can find full details in your account under "My Bookings".</p>
        `),
      }

    case 'shift_assigned':
      return {
        subject: `New cleaning assignment - ${data.whenLabel ?? ''}`,
        html: wrap('You have a new assignment', `
          <p>Hi ${escapeHtml(data.staffName)},</p>
          <p>You have been assigned a new cleaning job.</p>
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px;">
            <tr><td style="padding: 6px 0; color: #666;">Date &amp; time</td><td style="padding: 6px 0; text-align: right;">${escapeHtml(data.whenLabel)}</td></tr>
            ${data.address ? `<tr><td style="padding: 6px 0; color: #666;">Address</td><td style="padding: 6px 0; text-align: right;">${escapeHtml(data.address)}</td></tr>` : ''}
            ${data.customerName ? `<tr><td style="padding: 6px 0; color: #666;">Customer</td><td style="padding: 6px 0; text-align: right;">${escapeHtml(data.customerName)}</td></tr>` : ''}
          </table>
          <p>Log in to your account to see all the details.</p>
        `),
      }

    case 'invoice':
      return {
        subject: `Invoice ${data.invoiceNumber} from Stockholm Cleaning Co.`,
        html: wrap('New invoice', `
          <p>Hi ${escapeHtml(data.name)},</p>
          <p>A new invoice has been created for your completed cleaning.</p>
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px;">
            <tr><td style="padding: 6px 0; color: #666;">Invoice number</td><td style="padding: 6px 0; text-align: right; font-family: monospace;">${escapeHtml(data.invoiceNumber)}</td></tr>
            <tr><td style="padding: 6px 0; color: #666;">To pay</td><td style="padding: 6px 0; text-align: right; font-weight: 600;">${escapeHtml(data.customerPays)} kr</td></tr>
            <tr><td style="padding: 6px 0; color: #666;">Due date</td><td style="padding: 6px 0; text-align: right;">${escapeHtml(data.dueDate)}</td></tr>
          </table>
          <p>Log in to your account to pay the invoice online.</p>
        `),
      }

    case 'team_invite':
      return {
        subject: `You have been given an account at Stockholm Cleaning Co.`,
        html: wrap('Welcome to the team', `
          <p>Hi ${escapeHtml(data.name)},</p>
          <p>You have been added as <strong>${escapeHtml(data.role === 'coordinator' ? 'supervisor' : data.role === 'admin' ? 'administrator' : 'cleaner')}</strong> at Stockholm Cleaning Co.</p>
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px;">
            <tr><td style="padding: 6px 0; color: #666;">Email</td><td style="padding: 6px 0; text-align: right; font-family: monospace;">${escapeHtml(data.email)}</td></tr>
            <tr><td style="padding: 6px 0; color: #666;">Temporary password</td><td style="padding: 6px 0; text-align: right; font-family: monospace;">${escapeHtml(data.tempPassword)}</td></tr>
          </table>
          <p style="font-size: 13px; color: #666;">Log in and change your password as soon as possible.</p>
        `),
      }

    case 'payment_receipt':
      return {
        subject: `Payment confirmation — Invoice ${data.invoiceNumber}`,
        html: wrap('Thank you for your payment', `
          <p>Hi ${escapeHtml(data.name)},</p>
          <p>We have received your payment. Here is your receipt:</p>
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px;">
            <tr><td style="padding: 6px 0; color: #666;">Invoice number</td><td style="padding: 6px 0; text-align: right; font-family: monospace;">${escapeHtml(data.invoiceNumber)}</td></tr>
            <tr><td style="padding: 6px 0; color: #666;">Amount paid</td><td style="padding: 6px 0; text-align: right; font-weight: 600;">${escapeHtml(data.amountPaid)} kr</td></tr>
            <tr><td style="padding: 6px 0; color: #666;">Payment date</td><td style="padding: 6px 0; text-align: right;">${escapeHtml(data.paidDate)}</td></tr>
          </table>
          <p>Thank you for choosing Stockholm Cleaning Co.!</p>
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
    // eslint-disable-next-line no-console
    console.log(`[Email] (RESEND_API_KEY not configured — logging instead) → ${to} | template: ${template}`)
    // eslint-disable-next-line no-console
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
