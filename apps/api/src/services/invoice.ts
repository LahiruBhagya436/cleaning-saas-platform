import { prisma } from '../lib/prisma'
import { AppError } from '../middleware/errorHandler'
import { sendEmail } from './email'

export async function generateInvoice(bookingId: string): Promise<string> {
  const booking = await prisma.booking.findUnique({
    where:   { id: bookingId },
    include: { customer: true, property: true, items: { include: { service: true } } },
  })
  if (!booking) throw new AppError('NOT_FOUND', 'Booking not found', 404)
  if (booking.status !== 'completed') throw new AppError('INVALID_STATUS', 'Can only invoice completed bookings', 400)

  const existing = await prisma.invoice.findUnique({ where: { bookingId } })
  if (existing) return existing.id

  const count         = await prisma.invoice.count({ where: { companyId: booking.companyId } })
  const invoiceNumber = `INV-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`
  const dueAt         = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

  const invoice = await prisma.invoice.create({
    data: {
      companyId: booking.companyId,
      bookingId,
      invoiceNumber,
      labourCost:   booking.totalPriceExclVat,
      materialsCost:0,
      vatAmount:    booking.vatAmount,
      rutDeduction: booking.rutDeduction,
      customerPays: booking.customerPays,
      status:       'sent',
      dueAt,
    },
  })

  await sendEmail({
    to:       booking.customer.email,
    template: 'invoice',
    data: {
      name:         booking.customer.fullName,
      invoiceNumber,
      customerPays: Number(booking.customerPays),
      dueDate:      dueAt.toLocaleDateString('sv-SE'),
    },
  })

  // ── RUT claim ────────────────────────────────────────────────────────────
  // If this invoice has a RUT deduction, the company needs to actually claim
  // that amount back from Skatteverket. We can only do that once we have the
  // customer's personnummer — if it's missing, we deliberately skip creating
  // the claim so it shows up as a "missing personnummer" follow-up in the
  // admin RUT claims view instead of silently losing money.
  if (Number(booking.rutDeduction) > 0 && booking.customer.personnummerEnc) {
    await prisma.rutClaim.create({
      data: {
        invoiceId:               invoice.id,
        customerPersonnummerEnc: booking.customer.personnummerEnc,
        claimAmount:             booking.rutDeduction,
        claimStatus:             'pending',
      },
    })
  }

  return invoice.id
}
