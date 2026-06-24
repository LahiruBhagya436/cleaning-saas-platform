import { Router, Request, Response, NextFunction } from 'express'
import { prisma } from '../lib/prisma'
import { stripe } from '../lib/stripe'
import { AppError } from '../middleware/errorHandler'
import { authenticate, requireSuperAdmin } from '../middleware/auth'

// Platform-owner-only routes: cross-company visibility for the SaaS operator
// (Lahiru), not for any individual cleaning company's admins. Gated by
// requireSuperAdmin, which only the `superadmin` role passes.
export const platformRoutes = Router()
platformRoutes.use(authenticate, requireSuperAdmin)

// ── GET /platform/overview — top-line numbers across the whole platform ──────
platformRoutes.get('/overview', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const [companyCount, activeCompanyCount, trialingCount, totalUsers, totalBookings, paidInvoices] =
      await Promise.all([
        prisma.company.count(),
        prisma.company.count({ where: { isActive: true, subscriptionStatus: 'active' } }),
        prisma.company.count({ where: { subscriptionStatus: 'trialing' } }),
        prisma.user.count(),
        prisma.booking.count(),
        prisma.invoice.aggregate({
          where: { status: 'paid' },
          _sum: { customerPays: true },
          _count: true,
        }),
      ])

    const gmv = Number(paidInvoices._sum.customerPays ?? 0)
    // Platform's own cut, mirrors PLATFORM_FEE_PERCENT used in invoices.ts checkout
    const platformFeePercent = Number(process.env.PLATFORM_FEE_PERCENT ?? '2.5')
    const estimatedRevenue = gmv * (platformFeePercent / 100)

    res.json({
      success: true,
      data: {
        companyCount,
        activeCompanyCount,
        trialingCount,
        totalUsers,
        totalBookings,
        paidInvoiceCount: paidInvoices._count,
        gmv,
        estimatedPlatformRevenue: estimatedRevenue,
        platformFeePercent,
      },
    })
  } catch (err) { next(err) }
})

// ── GET /platform/companies — every tenant with usage + billing snapshot ─────
platformRoutes.get('/companies', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const companies = await prisma.company.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { users: true, bookings: true, invoices: true } },
      },
    })

    const withRevenue = await Promise.all(
      companies.map(async (c) => {
        const paid = await prisma.invoice.aggregate({
          where: { companyId: c.id, status: 'paid' },
          _sum: { customerPays: true },
        })
        return {
          id: c.id,
          name: c.name,
          slug: c.slug,
          contactEmail: c.contactEmail,
          isActive: c.isActive,
          subscriptionTier: c.subscriptionTier,
          subscriptionStatus: c.subscriptionStatus,
          trialEndsAt: c.trialEndsAt,
          stripeOnboarded: c.stripeOnboarded,
          createdAt: c.createdAt,
          userCount: c._count.users,
          bookingCount: c._count.bookings,
          invoiceCount: c._count.invoices,
          revenue: Number(paid._sum.customerPays ?? 0),
        }
      })
    )

    res.json({ success: true, data: withRevenue })
  } catch (err) { next(err) }
})

// ── GET /platform/companies/:id — single-company detail drilldown ────────────
platformRoutes.get('/companies/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const company = await prisma.company.findUnique({ where: { id: req.params.id } })
    if (!company) throw new AppError('NOT_FOUND', 'Company not found', 404)

    const [users, recentBookings, paid] = await Promise.all([
      prisma.user.findMany({
        where: { companyId: company.id },
        select: { id: true, fullName: true, email: true, role: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.booking.findMany({
        where: { companyId: company.id },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { id: true, status: true, scheduledAt: true, createdAt: true },
      }),
      prisma.invoice.aggregate({
        where: { companyId: company.id, status: 'paid' },
        _sum: { customerPays: true },
        _count: true,
      }),
    ])

    res.json({
      success: true,
      data: {
        company,
        users,
        recentBookings,
        revenue: Number(paid._sum.customerPays ?? 0),
        paidInvoiceCount: paid._count,
      },
    })
  } catch (err) { next(err) }
})

// ── PATCH /platform/companies/:id — toggle active status / change tier ───────
platformRoutes.patch('/companies/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { isActive, subscriptionTier, subscriptionStatus } = req.body as {
      isActive?: boolean
      subscriptionTier?: 'starter' | 'professional' | 'enterprise'
      subscriptionStatus?: 'trialing' | 'active' | 'past_due' | 'canceled'
    }

    const company = await prisma.company.findUnique({ where: { id: req.params.id } })
    if (!company) throw new AppError('NOT_FOUND', 'Company not found', 404)

    const updated = await prisma.company.update({
      where: { id: req.params.id },
      data: {
        ...(isActive !== undefined ? { isActive } : {}),
        ...(subscriptionTier ? { subscriptionTier } : {}),
        ...(subscriptionStatus ? { subscriptionStatus } : {}),
      },
    })

    res.json({ success: true, data: updated })
  } catch (err) { next(err) }
})

// ── GET /platform/companies/:id/stripe — Stripe Connect account snapshot ─────
platformRoutes.get('/companies/:id/stripe', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const company = await prisma.company.findUnique({ where: { id: req.params.id } })
    if (!company) throw new AppError('NOT_FOUND', 'Company not found', 404)
    if (!company.stripeAccountId) {
      return res.json({ success: true, data: { connected: false } })
    }
    const account = await stripe.accounts.retrieve(company.stripeAccountId)
    res.json({
      success: true,
      data: {
        connected: true,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        detailsSubmitted: account.details_submitted,
      },
    })
  } catch (err) { next(err) }
})
