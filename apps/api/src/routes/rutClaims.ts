import { Router, Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { RutClaimStatus } from '@prisma/client'
import { prisma } from '../lib/prisma'
import { authenticate, requireAdmin } from '../middleware/auth'
import { AppError } from '../middleware/errorHandler'
import { decryptField, maskPersonnummer } from '../lib/crypto'

export const rutClaimRoutes = Router()
rutClaimRoutes.use(authenticate, requireAdmin)

// ── GET /admin/rut-claims ──────────────────────────────────────────────────────
// Lists every RUT claim for the company, plus invoices that are RUT-eligible
// but never got a claim because the customer hasn't supplied a personnummer yet.

rutClaimRoutes.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.companyId
    if (!companyId) throw new AppError('FORBIDDEN', 'No company context', 403)
    const { status } = req.query as { status?: string }

    const claims = await prisma.rutClaim.findMany({
      where: {
        invoice: { companyId },
        ...(status ? { claimStatus: status as RutClaimStatus } : {}),
      },
      include: {
        invoice: {
          include: {
            booking: { include: { customer: { select: { fullName: true, email: true } } } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const data = claims.map((c) => {
      let maskedPersonnummer = '—'
      try {
        maskedPersonnummer = maskPersonnummer(decryptField(c.customerPersonnummerEnc))
      } catch {
        maskedPersonnummer = 'dekrypteringsfel'
      }
      return {
        id:               c.id,
        invoiceId:        c.invoice.id,
        invoiceNumber:    c.invoice.invoiceNumber,
        customerName:     c.invoice.booking.customer.fullName,
        customerEmail:    c.invoice.booking.customer.email,
        claimAmount:      Number(c.claimAmount),
        claimStatus:      c.claimStatus,
        skatteverketRef:  c.skatteverketRef,
        rejectionReason:  c.rejectionReason,
        retryCount:       c.retryCount,
        submittedAt:      c.submittedAt,
        approvedAt:       c.approvedAt,
        maskedPersonnummer,
        bookingDate:      c.invoice.booking.scheduledAt,
        createdAt:        c.createdAt,
      }
    })

    // RUT-eligible invoices with no claim at all — these are stuck until the
    // customer adds their personnummer on their profile page.
    const missing = await prisma.invoice.findMany({
      where: { companyId, rutDeduction: { gt: 0 }, rutClaim: null },
      include: { booking: { include: { customer: { select: { fullName: true, email: true } } } } },
      orderBy: { createdAt: 'desc' },
    })

    res.json({
      success: true,
      data: {
        claims,
        missingPersonnummer: missing.map((inv) => ({
          invoiceId:     inv.id,
          invoiceNumber: inv.invoiceNumber,
          customerName:  inv.booking.customer.fullName,
          customerEmail: inv.booking.customer.email,
          rutDeduction:  Number(inv.rutDeduction),
        })),
      },
    })
  } catch (err) { next(err) }
})

// ── PATCH /admin/rut-claims/:id ────────────────────────────────────────────────
// Move a claim through pending -> submitted -> approved/rejected, and record
// the Skatteverket reference number once it's been filed.

const updateSchema = z.object({
  claimStatus:     z.enum(['pending', 'submitted', 'approved', 'rejected']).optional(),
  skatteverketRef: z.string().optional(),
  rejectionReason: z.string().optional(),
})

rutClaimRoutes.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.companyId
    if (!companyId) throw new AppError('FORBIDDEN', 'No company context', 403)
    const body = updateSchema.parse(req.body)

    const claim = await prisma.rutClaim.findFirst({
      where: { id: req.params.id, invoice: { companyId } },
    })
    if (!claim) throw new AppError('NOT_FOUND', 'RUT claim not found', 404)

    const data: Record<string, unknown> = { ...body }
    if (body.claimStatus === 'submitted' && claim.claimStatus !== 'submitted') {
      data.submittedAt = new Date()
    }
    if (body.claimStatus === 'approved') data.approvedAt = new Date()
    if (body.claimStatus === 'rejected') data.retryCount = claim.retryCount + 1

    const updated = await prisma.rutClaim.update({ where: { id: claim.id }, data })
    res.json({ success: true, data: updated })
  } catch (err) { next(err) }
})

// ── GET /admin/rut-claims/export.csv ───────────────────────────────────────────
// CSV of all pending claims, for manual filing with Skatteverket (no live API
// integration exists yet — this is the practical stopgap).

rutClaimRoutes.get('/export.csv', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.companyId
    if (!companyId) throw new AppError('FORBIDDEN', 'No company context', 403)

    const claims = await prisma.rutClaim.findMany({
      where: { invoice: { companyId }, claimStatus: 'pending' },
      include: { invoice: { include: { booking: { include: { customer: true } } } } },
      orderBy: { createdAt: 'asc' },
    })

    const header = ['Personnummer', 'Kundnamn', 'Fakturanummer', 'Belopp (SEK)', 'Bokningsdatum']
    const rows = claims.map((c) => {
      let pnr = 'DEKRYPTERINGSFEL'
      try { pnr = decryptField(c.customerPersonnummerEnc) } catch { /* leave error placeholder */ }
      return [
        pnr,
        `"${c.invoice.booking.customer.fullName.replace(/"/g, '""')}"`,
        c.invoice.invoiceNumber,
        Number(c.claimAmount).toFixed(2),
        c.invoice.booking.scheduledAt.toISOString().slice(0, 10),
      ].join(',')
    })

    const csv = [header.join(','), ...rows].join('\n')
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', 'attachment; filename="rut-claims.csv"')
    res.send(csv)
  } catch (err) { next(err) }
})
