import { Router, Request, Response, NextFunction } from 'express'
import { prisma } from '../lib/prisma'
import { authenticate } from '../middleware/auth'
import { AppError } from '../middleware/errorHandler'
import { stripe } from '../lib/stripe'
import { markInvoicePaid } from '../services/payments'

export const invoiceRoutes = Router()
invoiceRoutes.use(authenticate)

const WEB_URL = process.env.WEB_URL ?? 'http://localhost:3000'

// Platform's cut of every payment, taken via Stripe Connect application_fee_amount.
// Configurable per deployment; defaults to 2.5%.
const PLATFORM_FEE_PERCENT = Number(process.env.PLATFORM_FEE_PERCENT ?? '2.5')

invoiceRoutes.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const invoices = await prisma.invoice.findMany({
      where:   { companyId: req.user!.companyId, booking: { userId: req.user!.userId } },
      include: { rutClaim: true },
      orderBy: { createdAt: 'desc' },
    })
    res.json({ success: true, data: invoices })
  } catch (err) { next(err) }
})

invoiceRoutes.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const invoice = await prisma.invoice.findFirst({
      where:   { id: req.params.id, companyId: req.user!.companyId, booking: { userId: req.user!.userId } },
      include: { rutClaim: true, booking: { include: { property: true } } },
    })
    if (!invoice) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Invoice not found' } })
    res.json({ success: true, data: invoice })
  } catch (err) { next(err) }
})

// ── POST /invoices/:id/checkout — create a Stripe Checkout session ───────────

invoiceRoutes.post('/:id/checkout', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const invoice = await prisma.invoice.findFirst({
      where:   { id: req.params.id, companyId: req.user!.companyId, booking: { userId: req.user!.userId } },
      include: { booking: { include: { property: true, items: { include: { service: true } } } } },
    })
    if (!invoice) throw new AppError('NOT_FOUND', 'Invoice not found', 404)
    if (invoice.status === 'paid') throw new AppError('ALREADY_PAID', 'This invoice has already been paid', 400)
    if (invoice.status === 'void') throw new AppError('INVALID_STATUS', 'This invoice has been voided', 400)

    const company = await prisma.company.findUnique({ where: { id: invoice.companyId } })
    if (!company?.stripeAccountId || !company.stripeOnboarded) {
      throw new AppError('PAYMENTS_NOT_CONFIGURED', 'This company has not finished setting up online payments yet', 400)
    }

    const amountOre = Math.round(Number(invoice.customerPays) * 100) // SEK → öre
    const applicationFeeOre = Math.round(amountOre * (PLATFORM_FEE_PERCENT / 100))

    const session = await stripe.checkout.sessions.create({
      mode:                 'payment',
      payment_method_types: ['card'],
      customer_email:       req.user!.email,
      client_reference_id:  invoice.id,
      line_items: [{
        price_data: {
          currency:    'sek',
          unit_amount: amountOre,
          product_data: {
            name:        `Faktura ${invoice.invoiceNumber}`,
            description: invoice.booking.items.map(i => i.service.nameSv).join(', ') || 'Städtjänst',
          },
        },
        quantity: 1,
      }],
      // Stripe Connect destination charge: money lands on the company's own
      // connected account; the platform skims its application fee off the top.
      payment_intent_data: {
        application_fee_amount: applicationFeeOre,
        transfer_data: { destination: company.stripeAccountId },
      },
      metadata: {
        invoiceId: invoice.id,
        bookingId: invoice.bookingId,
        companyId: company.id,
      },
      success_url: `${WEB_URL}/dashboard/invoices/${invoice.id}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${WEB_URL}/dashboard/invoices?cancelled=1`,
    })

    res.json({ success: true, data: { url: session.url, sessionId: session.id } })
  } catch (err) { next(err) }
})

// ── POST /invoices/:id/confirm — reconcile a Checkout Session after redirect ─
// Webhooks are the source of truth, but they can lag (or be misconfigured in
// local dev). This lets the success page confirm payment immediately using
// the session_id Stripe redirects back with, instead of just polling and
// hoping the webhook lands.

invoiceRoutes.post('/:id/confirm', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionId } = req.body as { sessionId?: string }
    if (!sessionId) throw new AppError('VALIDATION_ERROR', 'sessionId is required', 422)

    const invoice = await prisma.invoice.findFirst({
      where: { id: req.params.id, companyId: req.user!.companyId, booking: { userId: req.user!.userId } },
    })
    if (!invoice) throw new AppError('NOT_FOUND', 'Invoice not found', 404)

    if (invoice.status === 'paid') {
      return res.json({ success: true, data: { status: 'paid' } })
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId)

    // Make sure this session actually belongs to this invoice before trusting it
    if (session.metadata?.invoiceId !== invoice.id && session.client_reference_id !== invoice.id) {
      throw new AppError('FORBIDDEN', 'Session does not match this invoice', 403)
    }

    if (session.payment_status === 'paid') {
      const paymentId = typeof session.payment_intent === 'string'
        ? session.payment_intent
        : session.payment_intent?.id ?? session.id
      await markInvoicePaid(invoice.id, paymentId)
      return res.json({ success: true, data: { status: 'paid' } })
    }

    res.json({ success: true, data: { status: session.payment_status } })
  } catch (err) { next(err) }
})
