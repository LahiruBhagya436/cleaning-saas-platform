import { Router, Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { Prisma, BookingStatus } from '@prisma/client'
import { prisma } from '../lib/prisma'
import { AppError } from '../middleware/errorHandler'
import { authenticate, requireAdmin, requireSupervisor } from '../middleware/auth'
import { sendEmail } from '../services/email'

export const adminRoutes = Router()
// Only `authenticate` here — each route below picks the right gate itself:
// requireAdmin (account management) vs requireSupervisor (admin OR coordinator,
// for day-to-day task assignment). Previously this whole router was gated by
// a requireAdmin that secretly let coordinators through everywhere, including
// account-management routes that should be admin-only.
adminRoutes.use(authenticate)

// ── Helpers ───────────────────────────────────────────────────────────────────

function hoursBetween(startTime: string, endTime: string): number {
  const [sh, sm] = startTime.split(':').map(Number)
  const [eh, em] = endTime.split(':').map(Number)
  return (eh * 60 + em - (sh * 60 + sm)) / 60
}

adminRoutes.get('/dashboard', requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
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

adminRoutes.get('/bookings', requireSupervisor, async (req: Request, res: Response, next: NextFunction) => {
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

// Admin OR coordinator ("supervisor") may assign work to ground-level staff —
// this is the one place coordinators get write access in this router.
adminRoutes.patch('/bookings/:id/assign', requireSupervisor, async (req: Request, res: Response, next: NextFunction) => {
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

adminRoutes.get('/staff', requireSupervisor, async (req: Request, res: Response, next: NextFunction) => {
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

adminRoutes.post('/staff/:id/schedule', requireSupervisor, async (req: Request, res: Response, next: NextFunction) => {
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

adminRoutes.delete('/staff/:id/schedule/:scheduleId', requireSupervisor, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schedule = await prisma.staffSchedule.findFirst({
      where: { id: req.params.scheduleId, staffId: req.params.id, staff: { companyId: req.user!.companyId } },
    })
    if (!schedule) throw new AppError('NOT_FOUND', 'Schedule entry not found', 404)
    await prisma.staffSchedule.delete({ where: { id: schedule.id } })
    res.status(204).send()
  } catch (err) { next(err) }
})

// ── GET /admin/team — list coordinators + cleaners for this company ──────────
// (Separate from /admin/staff, which only returns `staff` plus their
// schedule/job stats — this is the plain account-management list, covering
// both roles a company admin is allowed to create.)

adminRoutes.get('/team', requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const team = await prisma.user.findMany({
      where:   { companyId: req.user!.companyId, role: { in: ['staff', 'coordinator'] } },
      select:  { id: true, fullName: true, email: true, phone: true, role: true, isActive: true, createdAt: true },
      orderBy: [{ role: 'asc' }, { fullName: 'asc' }],
    })
    res.json({ success: true, data: team })
  } catch (err) { next(err) }
})

// ── POST /admin/team — admin-only: add a cleaner or supervisor profile ───────
// Per the platform's permission model: only `admin` (or `superadmin`) can add
// new staff/coordinator accounts to a company. Coordinators ("supervisors")
// can be handed task assignment (see /bookings/:id/assign above) but never
// account creation. Creates a real User row, scoped to the admin's own
// company, with a generated temp password emailed to the new person.

const createTeamMemberSchema = z.object({
  email:    z.string().email(),
  fullName: z.string().min(2).max(200),
  phone:    z.string().optional(),
  role:     z.enum(['staff', 'coordinator']), // staff = cleaner, coordinator = supervisor
})

adminRoutes.post('/team', requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.companyId
    if (!companyId) throw new AppError('FORBIDDEN', 'Your account is not attached to a company', 403)

    const body = createTeamMemberSchema.parse(req.body)

    const existing = await prisma.user.findUnique({ where: { email: body.email } })
    if (existing) throw new AppError('EMAIL_TAKEN', 'Email already registered', 409)

    const tempPassword = crypto.randomBytes(9).toString('base64url')
    const passwordHash = await bcrypt.hash(tempPassword, 12)

    const user = await prisma.user.create({
      data: {
        companyId,
        email:        body.email,
        fullName:     body.fullName,
        phone:        body.phone,
        role:         body.role,
        passwordHash,
      },
    })

    sendEmail({
      to: user.email,
      template: 'team_invite',
      data: { name: user.fullName, email: user.email, tempPassword, role: body.role },
    }).catch(() => {})

    res.status(201).json({
      success: true,
      // tempPassword returned so the admin can share it directly if email doesn't arrive
      data: { id: user.id, email: user.email, fullName: user.fullName, phone: user.phone, role: user.role, isActive: user.isActive, tempPassword },
    })
  } catch (err) { next(err) }
})

// ── PATCH /admin/team/:id — admin-only: activate/deactivate or change role ───
// Limited to swapping between staff <-> coordinator within the same company;
// promoting to admin/superadmin is deliberately out of scope here (that's
// gated separately, by the two named platform-owner emails — see
// /platform/companies/:id/admins).

const updateTeamMemberSchema = z.object({
  isActive: z.boolean().optional(),
  role:     z.enum(['staff', 'coordinator']).optional(),
  fullName: z.string().min(2).max(200).optional(),
  phone:    z.string().optional(),
})

adminRoutes.patch('/team/:id', requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = updateTeamMemberSchema.parse(req.body)
    const member = await prisma.user.findFirst({
      where: { id: req.params.id, companyId: req.user!.companyId, role: { in: ['staff', 'coordinator'] } },
    })
    if (!member) throw new AppError('NOT_FOUND', 'Team member not found', 404)

    const updated = await prisma.user.update({ where: { id: member.id }, data: body })
    res.json({
      success: true,
      data: { id: updated.id, email: updated.email, fullName: updated.fullName, phone: updated.phone, role: updated.role, isActive: updated.isActive },
    })
  } catch (err) { next(err) }
})

// ════════════════════════════════════════════════════════════════════════════
// Worker profile management — full CRUD including personal details
// ════════════════════════════════════════════════════════════════════════════

// Fields returned from the DB for a worker profile (never expose passwordHash)
const WORKER_SELECT = {
  id: true, fullName: true, email: true, phone: true, role: true,
  isActive: true, createdAt: true,
  // Worker profile fields
  addressLine1: true, city: true, postalCode: true,
  bankClearingNo: true,       // clearing number is not secret
  bankAccountEnc: true,       // encrypted — frontend decrypts or displays masked
  emergencyContact: true, emergencyPhone: true,
  hireDate: true, employmentNotes: true,
  personnummerEnc: true,      // encrypted
}

// ── GET /admin/workers/:id — full profile for one worker ─────────────────────
adminRoutes.get('/workers/:id', requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const worker = await prisma.user.findFirst({
      where:  { id: req.params.id, companyId: req.user!.companyId, role: { in: ['staff', 'coordinator'] } },
      select: WORKER_SELECT,
    })
    if (!worker) throw new AppError('NOT_FOUND', 'Worker not found', 404)
    res.json({ success: true, data: worker })
  } catch (err) { next(err) }
})

// ── POST /admin/workers — create worker with full profile ─────────────────────
const createWorkerSchema = z.object({
  email:            z.string().email(),
  fullName:         z.string().min(2).max(200),
  phone:            z.string().optional(),
  role:             z.enum(['staff', 'coordinator']),
  // Profile
  personnummer:     z.string().optional(),   // raw — backend encrypts
  addressLine1:     z.string().max(300).optional(),
  city:             z.string().max(100).optional(),
  postalCode:       z.string().max(20).optional(),
  bankAccount:      z.string().max(50).optional(),  // raw — backend encrypts
  bankClearingNo:   z.string().max(10).optional(),
  emergencyContact: z.string().max(200).optional(),
  emergencyPhone:   z.string().max(30).optional(),
  hireDate:         z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  employmentNotes:  z.string().max(2000).optional(),
})

function encryptField(value: string | undefined): string | undefined {
  if (!value) return undefined
  // Simple AES-256-GCM encryption using ENCRYPTION_KEY env var.
  // Falls back to base64 if key not configured (dev / early setup).
  const key = process.env.ENCRYPTION_KEY
  if (!key) return Buffer.from(value).toString('base64') // dev fallback
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(key, 'hex'), iv)
  const enc = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return `${iv.toString('hex')}:${enc.toString('hex')}:${tag.toString('hex')}`
}

adminRoutes.post('/workers', requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.companyId
    if (!companyId) throw new AppError('FORBIDDEN', 'Your account is not attached to a company', 403)

    const body = createWorkerSchema.parse(req.body)

    const existing = await prisma.user.findUnique({ where: { email: body.email } })
    if (existing) throw new AppError('EMAIL_TAKEN', 'Email already registered', 409)

    const tempPassword = crypto.randomBytes(9).toString('base64url')
    const passwordHash = await bcrypt.hash(tempPassword, 12)

    const hireDate = body.hireDate ? new Date(body.hireDate) : undefined

    const user = await prisma.user.create({
      data: {
        companyId,
        email:            body.email,
        fullName:         body.fullName,
        phone:            body.phone,
        role:             body.role,
        passwordHash,
        addressLine1:     body.addressLine1,
        city:             body.city,
        postalCode:       body.postalCode,
        bankClearingNo:   body.bankClearingNo,
        bankAccountEnc:   encryptField(body.bankAccount),
        personnummerEnc:  encryptField(body.personnummer),
        emergencyContact: body.emergencyContact,
        emergencyPhone:   body.emergencyPhone,
        hireDate,
        employmentNotes:  body.employmentNotes,
      },
      select: WORKER_SELECT,
    })

    sendEmail({
      to: user.email,
      template: 'team_invite',
      data: { name: user.fullName, email: user.email, tempPassword, role: body.role },
    }).catch(() => {})

    res.status(201).json({ success: true, data: { ...user, tempPassword } })
  } catch (err) { next(err) }
})

// ── PATCH /admin/workers/:id — update full worker profile ─────────────────────
const updateWorkerSchema = z.object({
  fullName:         z.string().min(2).max(200).optional(),
  phone:            z.string().optional().nullable(),
  role:             z.enum(['staff', 'coordinator']).optional(),
  isActive:         z.boolean().optional(),
  // Profile
  personnummer:     z.string().optional().nullable(),
  addressLine1:     z.string().max(300).optional().nullable(),
  city:             z.string().max(100).optional().nullable(),
  postalCode:       z.string().max(20).optional().nullable(),
  bankAccount:      z.string().max(50).optional().nullable(),
  bankClearingNo:   z.string().max(10).optional().nullable(),
  emergencyContact: z.string().max(200).optional().nullable(),
  emergencyPhone:   z.string().max(30).optional().nullable(),
  hireDate:         z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  employmentNotes:  z.string().max(2000).optional().nullable(),
})

adminRoutes.patch('/workers/:id', requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const member = await prisma.user.findFirst({
      where: { id: req.params.id, companyId: req.user!.companyId, role: { in: ['staff', 'coordinator'] } },
    })
    if (!member) throw new AppError('NOT_FOUND', 'Worker not found', 404)

    const body = updateWorkerSchema.parse(req.body)

    const updateData: Record<string, unknown> = {}
    if (body.fullName         !== undefined) updateData.fullName         = body.fullName
    if (body.phone            !== undefined) updateData.phone            = body.phone
    if (body.role             !== undefined) updateData.role             = body.role
    if (body.isActive         !== undefined) updateData.isActive         = body.isActive
    if (body.addressLine1     !== undefined) updateData.addressLine1     = body.addressLine1
    if (body.city             !== undefined) updateData.city             = body.city
    if (body.postalCode       !== undefined) updateData.postalCode       = body.postalCode
    if (body.bankClearingNo   !== undefined) updateData.bankClearingNo   = body.bankClearingNo
    if (body.emergencyContact !== undefined) updateData.emergencyContact = body.emergencyContact
    if (body.emergencyPhone   !== undefined) updateData.emergencyPhone   = body.emergencyPhone
    if (body.employmentNotes  !== undefined) updateData.employmentNotes  = body.employmentNotes
    if (body.hireDate         !== undefined) updateData.hireDate         = body.hireDate ? new Date(body.hireDate) : null
    // Encrypt sensitive fields only when explicitly supplied
    if (body.bankAccount      !== undefined) updateData.bankAccountEnc   = body.bankAccount ? encryptField(body.bankAccount) : null
    if (body.personnummer     !== undefined) updateData.personnummerEnc  = body.personnummer ? encryptField(body.personnummer) : null

    const updated = await prisma.user.update({
      where:  { id: member.id },
      data:   updateData,
      select: WORKER_SELECT,
    })
    res.json({ success: true, data: updated })
  } catch (err) { next(err) }
})

// ── DELETE /admin/workers/:id — deactivate (soft-delete) a worker ─────────────
adminRoutes.delete('/workers/:id', requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const member = await prisma.user.findFirst({
      where: { id: req.params.id, companyId: req.user!.companyId, role: { in: ['staff', 'coordinator'] } },
    })
    if (!member) throw new AppError('NOT_FOUND', 'Worker not found', 404)

    // Soft-delete: deactivate and unassign from pending bookings
    await prisma.$transaction([
      prisma.user.update({ where: { id: member.id }, data: { isActive: false } }),
      prisma.booking.updateMany({
        where:  { staffId: member.id, status: { in: ['pending', 'confirmed'] } },
        data:   { staffId: null, status: 'pending' },
      }),
    ])

    res.json({ success: true, data: { id: member.id, deactivated: true } })
  } catch (err) { next(err) }
})
