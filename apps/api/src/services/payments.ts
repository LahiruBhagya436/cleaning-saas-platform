import { prisma } from '../lib/prisma'
import { sendEmail } from './email'

/**
 * Idempotently marks an invoice as paid. Safe to call multiple times for the
 * same invoice (e.g. once from the success-page reconciliation call and again
 * from the Stripe webhook) - only the first call has any effect.
 */
export async function markInvoicePaid(invoiceId: string, stripePaymentId: string | null) {
  const invoice = await prisma.invoice.findUnique({
    where:   { id: invoiceId },
    include: { booking: { include: { customer: true } } },
  })
  if (!invoice) return null
  if (invoice.status === 'paid') return invoice // already processed, no-op

  const updated = await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      status:          'paid',
      paidAt:          new Date(),
      stripePaymentId: stripePaymentId ?? invoice.stripePaymentId,
    },
  })

  const customer = invoice.booking?.customer
  if (customer) {
    sendEmail({
      to: customer.email,
      template: 'payment_receipt',
      data: {
        name:          customer.fullName,
        invoiceNumber: invoice.invoiceNumber,
        amountPaid:    Number(invoice.customerPays),
        paidDate:      updated.paidAt!.toLocaleDateString('sv-SE'),
      },
    })
      .then(() => prisma.invoice.update({ where: { id: invoiceId }, data: { emailSentAt: new Date() } }))
      .catch(console.error)
  }

  return updated
}
