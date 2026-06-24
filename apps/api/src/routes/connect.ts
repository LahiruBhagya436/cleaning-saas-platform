import { Router, Request, Response, NextFunction } from 'express'
import { prisma } from '../lib/prisma'
import { stripe } from '../lib/stripe'
import { AppError } from '../middleware/errorHandler'
import { authenticate, requireAdmin } from '../middleware/auth'

export const connectRoutes = Router()
connectRoutes.use(authenticate, requireAdmin)

const WEB_URL = process.env.WEB_URL ?? 'http://localhost:3000'

// ── GET /admin/stripe/status — onboarding + payouts status for this company ──

connectRoutes.get('/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const company = await prisma.company.findUnique({ where: { id: req.user!.companyId! } })
    if (!company) throw new AppError('NOT_FOUND', 'Company not found', 404)

    if (!company.stripeAccountId) {
      return res.json({ success: true, data: { connected: false, onboarded: false } })
    }

    const account = await stripe.accounts.retrieve(company.stripeAccountId)
    const onboarded = !!account.charges_enabled && !!account.payouts_enabled

    if (onboarded !== company.stripeOnboarded) {
      await prisma.company.update({ where: { id: company.id }, data: { stripeOnboarded: onboarded } })
    }

    res.json({
      success: true,
      data: {
        connected: true,
        onboarded,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        detailsSubmitted: account.details_submitted,
        requirementsDue: account.requirements?.currently_due ?? [],
      },
    })
  } catch (err) { next(err) }
})

// ── POST /admin/stripe/onboard — create (if needed) the connected account ────
// and return a fresh Stripe-hosted onboarding link.

connectRoutes.post('/onboard', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const company = await prisma.company.findUnique({ where: { id: req.user!.companyId! } })
    if (!company) throw new AppError('NOT_FOUND', 'Company not found', 404)

    let accountId = company.stripeAccountId
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'SE',
        email: company.contactEmail,
        business_type: 'company',
        company: { name: company.name },
        capabilities: {
          card_payments: { requested: true },
          transfers:     { requested: true },
        },
      })
      accountId = account.id
      await prisma.company.update({ where: { id: company.id }, data: { stripeAccountId: accountId } })
    }

    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      type: 'account_onboarding',
      refresh_url: `${WEB_URL}/admin/settings/payments?refresh=1`,
      return_url:  `${WEB_URL}/admin/settings/payments?onboarded=1`,
    })

    res.json({ success: true, data: { url: accountLink.url } })
  } catch (err) { next(err) }
})

// ── POST /admin/stripe/dashboard-link — quick link into their Express dashboard

connectRoutes.post('/dashboard-link', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const company = await prisma.company.findUnique({ where: { id: req.user!.companyId! } })
    if (!company?.stripeAccountId) throw new AppError('NOT_CONNECTED', 'Stripe account not connected yet', 400)

    const loginLink = await stripe.accounts.createLoginLink(company.stripeAccountId)
    res.json({ success: true, data: { url: loginLink.url } })
  } catch (err) { next(err) }
})
