import { Router, Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { Prisma, BookingStatus } from '@prisma/client'
import { prisma } from '../lib/prisma'
import { AppError } from '../middleware/errorHandler'
import { authenticate, requireAdmin } from '../middleware/auth'

export const adminRoutes = Router()
adminRoutes.use(authenticate, requireAdmin)

// ── Helpers ───────────────────────────────────────────────────────────────────

function hoursBetween(startTime: string, endTime: string): number {
  const [sh, sm] = startTime.split(':').map(Number)
  const [eh, em] = endTime.split(':').map(Number)
  return (eh * 60 + em - (sh * 60 + sm)) / 60
}

adminRoutes.get('/dashboard', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.companyId!
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)
    const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0)

    const [bookingsToday, activeStaff, monthRevenue, pendingRut] = await Promise.all([
      prisma.booking.count({ where: { companyId, scheduledAt: { gte: todayStart }, status: { not: 'cancelled' } } }),
      prisma.user.count({ where: { companyId, role: 'staff', isActive: true } }),
      prisma.invoice.aggregate({ where: { companyId, status: 'paid', paidAt: { gte: monthStart } }, _sum: { customerPays: true } }),
      prisma.rutClaim.count({ where: { claimStatus: 'pending', invoice: { companyId } } }),
    ])
    res.json({
      success: true,
      data: { totalBookingsToday: bookingsToday, activeStaff, revenueThisMonth: Number(monthRevenue._sum.customerPays ?? 0), rutPendingCount: pendingRut },
    })
  } catch (err) { next(err) }
})

adminRoutes.get('/bookings', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, limit = '20' } = req.query
    const where: Prisma.BookingWhereInput = { companyId: req.user!.companyId ?? undefined }
    if (status) where.status = status as BookingStatus
    const bookings = await prisma.booking.findMany({
      where, take: Math.min(Number(limit), 100), orderBy: { scheduledAt: 'desc' },
      include: { customer: { select: { fullName: true, email: true } }, staff: { select: { id: true, fullName: true } }, property: true },
    })
    res.json({ success: true, data: bookings })
  } catch (err) { next(err) }
})

// ── PATCH /admin/bookings/:id/assign ──────────────────────────────────────────
// Assign (or reassign) a staff member to a booking.

const assignSchema = z.object({ staffId: z.string().uuid().nullable() })

adminRoutes.patch('/bookings/:id/assign', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { staffId } = assignSchema.parse(req.body)
    const companyId = req.user!.companyId!

    const booking = await prisma.booking.findFirst({ where: { id: req.params.id, companyId } })
    if (!booking) throw new AppError('NOT_FOUND', 'Booking not found', 404)
    if (['completed', 'cancelled'].includes(booking.status)) {
      throw new AppError('INVALID_STATUS', 'Cannot reassign a completed or cancelled booking', 400)
    }

    if (staffId) {
      const staff = await prisma.user.findFirst({ where: { id: staffId, role: 'staff', isActive: true, companyId } })
      if (!staff) throw new AppError('NOT_FOUND', 'Staff member not found', 404)

      // Conflict check — same staff already booked on an overlapping job
      const conflict = await prisma.booking.findFirst({
        where: {
          id:             { not: booking.id },
          staffId,
          companyId,
          status:         { notIn: ['cancelled'] },
          scheduledAt:    { lt: booking.estimatedEndAt },
          estimatedEndAt: { gt: booking.scheduledAt },
        },
      })
      if (conflict) throw new AppError('STAFF_CONFLICT', 'This staff member already has a job in that time slot', 409)
    }

    const updated = await prisma.booking.update({
      where: { id: booking.id },
      data: {
        staffId,
        status: staffId ? 'confirmed' : 'pending',
      },
      include: {
        customer: { select: { fullName: true, email: true } },
        staff:    { select: { id: true, fullName: true } },
        property: true,
      },
    })

    res.json({ success: true, data: updated })
  } catch (err) { next(err) }
})

// ── GET /admin/staff ───────────────────────────────────────────────────────────
// All workers with their upcoming schedule, total scheduled hours, and job counts.

adminRoutes.get('/staff', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const horizon = new Date(today); horizon.setDate(horizon.getDate() + 30)

    const staff = await prisma.user.findMany({
      where:   { role: 'staff', companyId: req.user!.companyId },
      select:  {
        id: true, fullName: true, email: true, phone: true, isActive: true, createdAt: true,
        schedules: {
          where:   { workDate: { gte: today, lte: horizon } },
          orderBy: { workDate: 'asc' },
        },
        bookingsAsStaff: {
          where:   { status: { in: ['pending', 'confirmed', 'in_progress'] }, scheduledAt: { gte: today } },
          orderBy: { scheduledAt: 'asc' },
          include: { property: true, customer: { select: { fullName: true } } },
        },
      },
      orderBy: { fullName: 'asc' },
    })

    const result = staff.map((s) => {
      const totalScheduledHours = s.schedules
        .filter((d) => d.isAvailable)
        .reduce((sum, d) => sum + hoursBetween(d.startTime, d.endTime), 0)

      return {
        id: s.id,
        fullName: s.fullName,
        email: s.email,
        phone: s.phone,
        isActive: s.isActive,
        createdAt: s.createdAt,
        schedule: s.schedules,
        totalScheduledHours,
        assignedJobs: s.bookingsAsStaff,
        assignedJobCount: s.bookingsAsStaff.length,
      }
    })

    res.json({ success: true, data: result })
  } catch (err) { next(err) }
})

// ── POST /admin/staff/:id/schedule ────────────────────────────────────────────
// Set/update a single work day for a staff member.

const scheduleSchema = z.object({
  workDate:    z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime:   z.string().regex(/^\d{2}:\d{2}$/),
  endTime:     z.string().regex(/^\d{2}:\d{2}$/),
  isAvailable: z.boolean().default(true),
  notes:       z.string().max(500).optional(),
})

adminRoutes.post('/staff/:id/schedule', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = scheduleSchema.parse(req.body)

    const staff = await prisma.user.findFirst({ where: { id: req.params.id, role: 'staff', companyId: req.user!.companyId } })
    if (!staff) throw new AppError('NOT_FOUND', 'Staff member not found', 404)

    if (hoursBetween(body.startTime, body.endTime) <= 0) {
      throw new AppError('INVALID_RANGE', 'End time must be after start time', 400)
    }

    const workDate = new Date(body.workDate)
    const schedule = await prisma.staffSchedule.upsert({
      where:  { staffId_workDate: { staffId: staff.id, workDate } },
      update: { startTime: body.startTime, endTime: body.endTime, isAvailable: body.isAvailable, notes: body.notes },
      create: {
        staffId: staff.id, workDate,
        startTime: body.startTime, endTime: body.endTime,
        isAvailable: body.isAvailable, notes: body.notes,
      },
    })

    res.status(201).json({ success: true, data: schedule })
  } catch (err) { next(err) }
})

// ── DELETE /admin/staff/:id/schedule/:scheduleId ──────────────────────────────

adminRoutes.delete('/staff/:id/schedule/:scheduleId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schedule = await prisma.staffSchedule.findFirst({
      where: { id: req.params.scheduleId, staffId: req.params.id, staff: { companyId: req.user!.companyId } },
    })
    if (!schedule) throw new AppError('NOT_FOUND', 'Schedule entry not found', 404)
    await prisma.staffSchedule.delete({ where: { id: schedule.id } })
    res.status(204).send()
  } catch (err) { next(err) }
})
