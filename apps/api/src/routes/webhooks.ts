import { Router, Request, Response } from 'express'
import Stripe from 'stripe'
import { stripe } from '../lib/stripe'
import { prisma } from '../lib/prisma'
import { markInvoicePaid } from '../services/payments'

export const webhookRoutes = Router()

webhookRoutes.post('/stripe', async (req: Request, res: Response) => {
  const signature = req.headers['stripe-signature']
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!signature || !webhookSecret) {
    console.error('[Webhook] Missing Stripe signature or STRIPE_WEBHOOK_SECRET — rejecting')
    return res.status(400).json({ received: false, error: 'Webhook not configured' })
  }

  let event: Stripe.Event
  try {
    // req.body is the raw Buffer here (see express.raw() applied to /v1/webhooks in server.ts)
    event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret)
  } catch (err) {
    console.error('[Webhook] Signature verification failed:', (err as Error).message)
    return res.status(400).json({ received: false, error: 'Invalid signature' })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const invoiceId = session.metadata?.invoiceId ?? session.client_reference_id
        if (!invoiceId) {
          console.error('[Webhook] checkout.session.completed with no invoiceId in metadata')
          break
        }

        const paymentId = typeof session.payment_intent === 'string'
          ? session.payment_intent
          : session.payment_intent?.id ?? session.id

        const updated = await markInvoicePaid(invoiceId, paymentId)
        if (!updated) {
          console.error(`[Webhook] Invoice ${invoiceId} not found for completed session ${session.id}`)
          break
        }
        console.log(`[Webhook] Invoice ${updated.invoiceNumber} marked paid via Stripe session ${session.id}`)
        break
      }

      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session
        console.log(`[Webhook] Checkout session ${session.id} expired without payment`)
        break
      }

      // Connected-account onboarding status changed (e.g. company finished
      // or lost Stripe onboarding requirements). Keep our cached flag in sync
      // so the checkout route doesn't have to call Stripe on every request.
      // NOTE: Stripe only sends `account.updated` here if a *Connect* webhook
      // endpoint (Dashboard → Webhooks → "+ Add destination" with "Connect"
      // event source) is also pointed at this same /v1/webhooks/stripe URL,
      // in addition to the regular account-level endpoint used for checkout
      // events above. The GET /admin/stripe/status route polls Stripe
      // directly as a fallback, so onboarding still works even before that's set up.
      case 'account.updated': {
        const account = event.data.object as Stripe.Account
        const onboarded = !!account.charges_enabled && !!account.payouts_enabled
        const updated = await prisma.company.updateMany({
          where: { stripeAccountId: account.id },
          data:  { stripeOnboarded: onboarded },
        })
        if (updated.count > 0) {
          console.log(`[Webhook] Stripe account ${account.id} onboarded=${onboarded}`)
        }
        break
      }

      default:
        // Unhandled event types are fine to ignore
        break
    }

    res.json({ received: true })
  } catch (err) {
    console.error('[Webhook] Handler error:', err)
    // Return 500 so Stripe retries delivery
    res.status(500).json({ received: false })
  }
})
