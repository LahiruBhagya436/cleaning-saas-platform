import cron from 'node-cron'
import { prisma } from '../lib/prisma'
import { sendNotification } from '../services/notifications'

export function setupCronJobs() {
  // ── Booking day-before reminders (runs every day at 09:00) ───────────────
  cron.schedule('0 9 * * *', async () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)
    const dayAfter = new Date(tomorrow)
    dayAfter.setDate(dayAfter.getDate() + 1)

    const bookings = await prisma.booking.findMany({
      where: {
        scheduledAt: { gte: tomorrow, lt: dayAfter },
        status: 'confirmed',
      },
    })

    for (const b of bookings) {
      await sendNotification({
        userId: b.userId,
        type:   'booking_reminder',
        data:   { bookingId: b.id, scheduledAt: b.scheduledAt.toISOString() },
      })
    }
    console.info(`[Cron] Sent ${bookings.length} booking reminders`)
  })

  // ── Review requests (runs every hour) ────────────────────────────────────
  cron.schedule('0 * * * *', async () => {
    const twoHoursAgo   = new Date(Date.now() - 2 * 3600000)
    const threeHoursAgo = new Date(Date.now() - 3 * 3600000)

    const recentlyCompleted = await prisma.booking.findMany({
      where: {
        status:          'completed',
        staffCompletedAt:{ gte: threeHoursAgo, lt: twoHoursAgo },
        reviews:         { none: {} },
      },
    })

    for (const b of recentlyCompleted) {
      await sendNotification({
        userId: b.userId,
        type:   'review_request',
        data:   { bookingId: b.id },
      })
    }
  })

  // ── Mark overdue invoices (runs every day at 00:01) ───────────────────────
  cron.schedule('1 0 * * *', async () => {
    await prisma.invoice.updateMany({
      where: { status: 'sent', dueAt: { lt: new Date() } },
      data:  { status: 'overdue' },
    })
  })

  console.info('[Cron] All jobs scheduled')
}
