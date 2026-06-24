import { Router, Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { AppError } from '../middleware/errorHandler'
import { authenticate, requireAdmin } from '../middleware/auth'
import { calculateBookingPrice } from '../services/pricing'
import { generateChecklist } from '../services/checklist'
import { sendNotification } from '../services/notifications'
import { sendEmail } from '../services/email'

export const bookingRoutes = Router()
bookingRoutes.use(authenticate)

// ── Schemas ───────────────────────────────────────────────────────────────────

const createBookingSchema = z.object({
  propertyId:       z.string().uuid(),
  serviceIds:       z.array(z.string().uuid()).min(1),
  scheduledAt:      z.string().datetime(),
  durationMinutes:  z.number().int().min(60).max(480),
  recurrence:       z.enum(['none','weekly','biweekly','monthly']).default('none'),
  recurrenceEndDate:z.string().optional(),
  notes:            z.string().max(1000).optional(),
})

const availabilitySchema = z.object({
  date:            z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  serviceIds:      z.string().optional(), // comma-separated
  durationMinutes: z.coerce.number().int().min(60),
  postalCode:      z.string().optional(),
})

// ── GET /bookings/availability ────────────────────────────────────────────────

bookingRoutes.get('/availability', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = availabilitySchema.parse(req.query)
    const date = new Date(query.date)
    const dayStart = new Date(date); dayStart.setHours(7, 0, 0, 0)
    const dayEnd   = new Date(date); dayEnd.setHours(20, 0, 0, 0)

    const companyId = req.user!.companyId!

    // Find all available staff for this date (same company only)
    const schedules = await prisma.staffSchedule.findMany({
      where: { workDate: date, isAvailable: true, staff: { companyId } },
      include: { staff: true },
    })

    // Get bookings for this day to check conflicts
    const existingBookings = await prisma.booking.findMany({
      where: {
        companyId,
        scheduledAt: { gte: dayStart, lte: dayEnd },
        status: { notIn: ['cancelled'] },
      },
    })

    // Generate 1-hour slots from 07:00 to 18:00
    const slots = []
    const slotDuration = query.durationMinutes
    for (let h = 7; h <= 18; h++) {
      const slotStart = new Date(date); slotStart.setHours(h, 0, 0, 0)
      const slotEnd   = new Date(slotStart.getTime() + slotDuration * 60000)
      if (slotEnd > dayEnd) break

      // Count available staff at this time
      const busyStaffIds = new Set(
        existingBookings
          .filter(b => {
            const bStart = new Date(b.scheduledAt)
            const bEnd = new Date(b.estimatedEndAt)
            return bStart < slotEnd && bEnd > slotStart
          })
          .map(b => b.staffId)
          .filter(Boolean)
      )

      const availableStaff = schedules.filter(s => !busyStaffIds.has(s.staffId))
      slots.push({
        startTime: slotStart.toISOString(),
        endTime:   slotEnd.toISOString(),
        available: availableStaff.length > 0,
        staffCount: availableStaff.length,
      })
    }

    res.json({ success: true, data: slots })
  } catch (err) { next(err) }
})

// ── GET /bookings ─────────────────────────────────────────────────────────────

bookingRoutes.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, limit = '20', after } = req.query
    const take = Math.min(Number(limit), 50)

    const where: any = { userId: req.user!.userId, companyId: req.user!.companyId }
    if (status) where.status = status
    if (after) where.id = { gt: after as string }

    const bookings = await prisma.booking.findMany({
      where,
      take,
      orderBy: { scheduledAt: 'desc' },
      include: {
        property: true,
        staff: { select: { id: true, fullName: true } },
        items: { include: { service: true } },
      },
    })

    res.json({
      success: true,
      data: bookings,
      meta: { limit: take, nextCursor: bookings.length === take ? bookings[take - 1]?.id : null },
    })
  } catch (err) { next(err) }
})

// ── POST /bookings ────────────────────────────────────────────────────────────

bookingRoutes.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = createBookingSchema.parse(req.body)
    const companyId = req.user!.companyId!

    // Verify property belongs to user
    const property = await prisma.property.findFirst({
      where: { id: body.propertyId, userId: req.user!.userId },
    })
    if (!property) throw new AppError('NOT_FOUND', 'Property not found', 404)

    // Fetch services (scoped to this company)
    const services = await prisma.service.findMany({
      where: { id: { in: body.serviceIds }, isActive: true, companyId },
    })
    if (services.length !== body.serviceIds.length) {
      throw new AppError('INVALID_SERVICE', 'One or more services not found', 400)
    }

    // Check slot availability
    const scheduledAt = new Date(body.scheduledAt)
    const estimatedEndAt = new Date(scheduledAt.getTime() + body.durationMinutes * 60000)

    const conflict = await prisma.booking.findFirst({
      where: {
        companyId,
        status: { notIn: ['cancelled'] },
        scheduledAt: { lt: estimatedEndAt },
        estimatedEndAt: { gt: scheduledAt },
        staff: { isNot: null },
      },
    })

    // Find an available staff member (same company only)
    const availableStaff = await prisma.user.findFirst({
      where: {
        role: 'staff',
        isActive: true,
        companyId,
        bookingsAsStaff: {
          none: {
            status: { notIn: ['cancelled'] },
            scheduledAt: { lt: estimatedEndAt },
            estimatedEndAt: { gt: scheduledAt },
          },
        },
      },
    })

    // Calculate pricing
    const pricing = calculateBookingPrice(services, body.durationMinutes)

    // Create booking in a transaction
    const booking = await prisma.$transaction(async (tx) => {
      const created = await tx.booking.create({
        data: {
          companyId,
          userId:           req.user!.userId,
          propertyId:       body.propertyId,
          staffId:          availableStaff?.id ?? null,
          scheduledAt,
          estimatedEndAt,
          durationMinutes:  body.durationMinutes,
          status:           availableStaff ? 'confirmed' : 'pending',
          recurrence:       body.recurrence,
          recurrenceEndDate:body.recurrenceEndDate ? new Date(body.recurrenceEndDate) : null,
          notes:            body.notes,
          totalPriceExclVat:pricing.totalExclVat,
          vatAmount:        pricing.vatAmount,
          rutDeduction:     pricing.rutDeduction,
          customerPays:     pricing.customerPays,
          items: {
            create: services.map(s => ({
              serviceId: s.id,
              quantity:  1,
              unitPrice: s.basePricePerHour,
            })),
          },
        },
        include: {
          property: true,
          customer: { select: { id: true, fullName: true, email: true } },
          staff: { select: { id: true, fullName: true } },
          items: { include: { service: true } },
        },
      })

      // Create checklist items
      const checklist = generateChecklist(services)
      if (checklist.length > 0) {
        await tx.checklistItem.createMany({
          data: checklist.map((item, i) => ({
            bookingId: created.id,
            label:     item.label,
            labelSv:   item.labelSv,
            sortOrder: i,
          })),
        })
      }

      return created
    })

    // Send confirmation notifications async
    sendNotification({
      userId: req.user!.userId,
      type: 'booking_confirmed',
      data: { bookingId: booking.id, scheduledAt: booking.scheduledAt.toISOString() },
    }).catch(console.error)

    sendEmail({
      to: booking.customer.email,
      template: 'booking_confirmed',
      data: {
        name:         booking.customer.fullName,
        dateLabel:    booking.scheduledAt.toLocaleString('sv-SE', { dateStyle: 'medium', timeStyle: 'short' }),
        address:      `${booking.property.addressLine1}, ${booking.property.city}`,
        staffName:    booking.staff?.fullName ?? null,
        customerPays: Number(booking.customerPays),
      },
    }).catch(console.error)

    res.status(201).json({ success: true, data: booking })
  } catch (err) { next(err) }
})

// ── GET /bookings/:id ─────────────────────────────────────────────────────────

bookingRoutes.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const booking = await prisma.booking.findFirst({
      where: { id: req.params.id, userId: req.user!.userId, companyId: req.user!.companyId ?? undefined },
      include: {
        property: true,
        staff: { select: { id: true, fullName: true, phone: true } },
        items: { include: { service: true } },
        invoice: { include: { rutClaim: true } },
        reviews: true,
        checklist: { orderBy: { sortOrder: 'asc' } },
      },
    })
    if (!booking) throw new AppError('NOT_FOUND', 'Booking not found', 404)
    res.json({ success: true, data: booking })
  } catch (err) { next(err) }
})

// ── PATCH /bookings/:id ───────────────────────────────────────────────────────

bookingRoutes.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      scheduledAt:    z.string().datetime().optional(),
      notes:          z.string().max(1000).optional(),
    })
    const body = schema.parse(req.body)

    const booking = await prisma.booking.findFirst({
      where: { id: req.params.id, userId: req.user!.userId, companyId: req.user!.companyId ?? undefined },
    })
    if (!booking) throw new AppError('NOT_FOUND', 'Booking not found', 404)
    if (['completed','cancelled'].includes(booking.status)) {
      throw new AppError('INVALID_STATUS', 'Cannot modify a completed or cancelled booking', 400)
    }

    const updateData: any = { ...body }
    if (body.scheduledAt) {
      updateData.scheduledAt = new Date(body.scheduledAt)
      updateData.estimatedEndAt = new Date(
        new Date(body.scheduledAt).getTime() + booking.durationMinutes * 60000
      )
    }

    const updated = await prisma.booking.update({
      where: { id: req.params.id },
      data: updateData,
      include: { property: true, staff: { select: { id: true, fullName: true } } },
    })

    res.json({ success: true, data: updated })
  } catch (err) { next(err) }
})

// ── DELETE /bookings/:id (cancel) ─────────────────────────────────────────────

bookingRoutes.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { cancellationReason } = req.body
    const booking = await prisma.booking.findFirst({
      where: { id: req.params.id, userId: req.user!.userId, companyId: req.user!.companyId ?? undefined },
    })
    if (!booking) throw new AppError('NOT_FOUND', 'Booking not found', 404)
    if (booking.status === 'completed') {
      throw new AppError('INVALID_STATUS', 'Cannot cancel a completed booking', 400)
    }
    // Enforce 24-hour cancellation policy
    const hoursUntil = (new Date(booking.scheduledAt).getTime() - Date.now()) / 3600000
    if (hoursUntil < 24) {
      throw new AppError('CANCELLATION_WINDOW', 'Cancellations must be made at least 24 hours in advance', 400)
    }

    await prisma.booking.update({
      where: { id: req.params.id },
      data: { status: 'cancelled', cancellationReason },
    })

    res.status(204).send()
  } catch (err) { next(err) }
})

// ── POST /bookings/:id/complete (staff) ───────────────────────────────────────

bookingRoutes.post('/:id/complete', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const booking = await prisma.booking.findFirst({
      where: { id: req.params.id, staffId: req.user!.userId, status: 'in_progress', companyId: req.user!.companyId ?? undefined },
    })
    if (!booking) throw new AppError('NOT_FOUND', 'Active booking not found', 404)

    const { completionNotes } = req.body
    await prisma.booking.update({
      where: { id: req.params.id },
      data: { status: 'completed', staffCompletedAt: new Date(), completionNotes },
    })

    // Trigger invoice generation asynchronously
    const { generateInvoice } = await import('../services/invoice')
    generateInvoice(booking.id).catch(console.error)

    res.json({ success: true, data: { message: 'Booking completed. Invoice will be generated shortly.' } })
  } catch (err) { next(err) }
})
