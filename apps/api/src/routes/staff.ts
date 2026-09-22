import { Router, Request, Response, NextFunction } from 'express'
import { prisma } from '../lib/prisma'
import { authenticate, requireAdmin, requireStaff } from '../middleware/auth'
import { z } from 'zod'
import { AppError } from '../middleware/errorHandler'

export const staffRoutes = Router()
staffRoutes.use(authenticate)

staffRoutes.get('/', requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const staff = await prisma.user.findMany({
      where:   { role: 'staff', isActive: true, companyId: req.user!.companyId ?? undefined },
      select:  { id: true, fullName: true, email: true, phone: true, createdAt: true },
      orderBy: { fullName: 'asc' },
    })
    res.json({ success: true, data: staff })
  } catch (err) { next(err) }
})

staffRoutes.get('/me/jobs/today', requireStaff, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)
    const todayEnd   = new Date(); todayEnd.setHours(23, 59, 59, 999)
    const jobs = await prisma.booking.findMany({
      where:   { staffId: req.user!.userId, companyId: req.user!.companyId ?? undefined, scheduledAt: { gte: todayStart, lte: todayEnd }, status: { in: ['confirmed', 'in_progress'] } },
      include: { property: true, customer: { select: { fullName: true, phone: true } } },
      orderBy: { scheduledAt: 'asc' },
    })
    res.json({ success: true, data: jobs })
  } catch (err) { next(err) }
})

staffRoutes.post('/me/jobs/:id/start', requireStaff, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const booking = await prisma.booking.findFirst({ where: { id: req.params.id, staffId: req.user!.userId, status: 'confirmed', companyId: req.user!.companyId ?? undefined } })
    if (!booking) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Booking not found' } })
    await prisma.booking.update({ where: { id: req.params.id }, data: { status: 'in_progress', staffArrivedAt: new Date() } })
    res.json({ success: true, data: { message: 'Job started' } })
  } catch (err) { next(err) }
})

// ── Self-service availability (own schedule) ──────────────────────────────────
// A cleaner (staff) or supervisor (coordinator) manages their OWN availability.
// requireStaff already allows staff, coordinator, admin, superadmin.

const selfScheduleSchema = z.object({
  workDate:    z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime:   z.string().regex(/^\d{2}:\d{2}$/),
  endTime:     z.string().regex(/^\d{2}:\d{2}$/),
  isAvailable: z.boolean().default(true),
})

const selfBulkSchema = z.object({
  startDate:   z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate:     z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  weekdays:    z.array(z.number().int().min(0).max(6)).min(1),
  startTime:   z.string().regex(/^\d{2}:\d{2}$/),
  endTime:     z.string().regex(/^\d{2}:\d{2}$/),
  isAvailable: z.boolean().default(true),
})

function selfMinutesBetween(a: string, b: string): number {
  const [ah, am] = a.split(':').map(Number)
  const [bh, bm] = b.split(':').map(Number)
  return (bh * 60 + bm) - (ah * 60 + am)
}

// List own upcoming availability (next 60 days)
staffRoutes.get('/me/schedule', requireStaff, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const from = new Date(); from.setHours(0, 0, 0, 0)
    const to   = new Date(from); to.setDate(to.getDate() + 60)
    const schedule = await prisma.staffSchedule.findMany({
      where:   { staffId: req.user!.userId, workDate: { gte: from, lte: to } },
      orderBy: { workDate: 'asc' },
    })
    res.json({ success: true, data: schedule })
  } catch (err) { next(err) }
})

// Add / update one own work day
staffRoutes.post('/me/schedule', requireStaff, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = selfScheduleSchema.parse(req.body)
    if (selfMinutesBetween(body.startTime, body.endTime) <= 0) {
      throw new AppError('INVALID_RANGE', 'End time must be after start time', 400)
    }
    const workDate = new Date(body.workDate)
    const schedule = await prisma.staffSchedule.upsert({
      where:  { staffId_workDate: { staffId: req.user!.userId, workDate } },
      update: { startTime: body.startTime, endTime: body.endTime, isAvailable: body.isAvailable },
      create: { staffId: req.user!.userId, workDate, startTime: body.startTime, endTime: body.endTime, isAvailable: body.isAvailable },
    })
    res.status(201).json({ success: true, data: schedule })
  } catch (err) { next(err) }
})

// Add / update own availability across a date range (selected weekdays)
staffRoutes.post('/me/schedule/bulk', requireStaff, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = selfBulkSchema.parse(req.body)
    if (selfMinutesBetween(body.startTime, body.endTime) <= 0) {
      throw new AppError('INVALID_RANGE', 'End time must be after start time', 400)
    }
    const startMs = new Date(body.startDate + 'T00:00:00Z').getTime()
    const endMs   = new Date(body.endDate + 'T00:00:00Z').getTime()
    if (Number.isNaN(startMs) || Number.isNaN(endMs) || endMs < startMs) {
      throw new AppError('INVALID_RANGE', 'End date must be on or after start date', 400)
    }
    const DAY = 86_400_000
    const MAX_DAYS = 366
    const weekdays = new Set(body.weekdays)
    const workDates: Date[] = []
    for (let i = 0; i <= MAX_DAYS; i++) {
      const ms = startMs + i * DAY
      if (ms > endMs) break
      const d = new Date(ms)
      if (weekdays.has(d.getUTCDay())) workDates.push(d)
    }
    if (workDates.length === 0) return res.json({ success: true, data: { count: 0 } })
    await prisma.$transaction(
      workDates.map((workDate) =>
        prisma.staffSchedule.upsert({
          where:  { staffId_workDate: { staffId: req.user!.userId, workDate } },
          update: { startTime: body.startTime, endTime: body.endTime, isAvailable: body.isAvailable },
          create: { staffId: req.user!.userId, workDate, startTime: body.startTime, endTime: body.endTime, isAvailable: body.isAvailable },
        })
      )
    )
    res.status(201).json({ success: true, data: { count: workDates.length } })
  } catch (err) { next(err) }
})

// Delete one own availability day
staffRoutes.delete('/me/schedule/:scheduleId', requireStaff, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const existing = await prisma.staffSchedule.findFirst({ where: { id: req.params.scheduleId, staffId: req.user!.userId } })
    if (!existing) throw new AppError('NOT_FOUND', 'Schedule entry not found', 404)
    await prisma.staffSchedule.delete({ where: { id: existing.id } })
    res.status(204).send()
  } catch (err) { next(err) }
})
