import { Router, Request, Response, NextFunction } from 'express'
import { prisma } from '../lib/prisma'
import { authenticate, requireAdmin, requireStaff } from '../middleware/auth'

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
