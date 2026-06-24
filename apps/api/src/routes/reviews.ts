import { Router, Request, Response, NextFunction } from 'express'
import { prisma } from '../lib/prisma'
import { authenticate } from '../middleware/auth'
import { resolveCompany } from '../middleware/company'

export const reviewRoutes = Router()

reviewRoutes.post('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { bookingId, rating, comment } = req.body
    if (!bookingId || !rating) return res.status(400).json({ success: false, error: { code: 'MISSING_FIELDS', message: 'bookingId and rating are required' } })
    const booking = await prisma.booking.findFirst({ where: { id: bookingId, userId: req.user!.userId, companyId: req.user!.companyId ?? undefined, status: 'completed' } })
    if (!booking || !booking.staffId) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Completed booking not found' } })
    const review = await prisma.review.create({
      data: { bookingId, userId: req.user!.userId, staffId: booking.staffId, rating: Number(rating), comment },
    })
    res.status(201).json({ success: true, data: review })
  } catch (err) { next(err) }
})

// Public review listing — scoped to the company resolved from subdomain/header.
reviewRoutes.get('/', resolveCompany, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reviews = await prisma.review.findMany({
      where: { isVisible: true, booking: { companyId: req.companyId } },
      orderBy: { createdAt: 'desc' }, take: 20,
      include: { customer: { select: { fullName: true } } },
    })
    res.json({ success: true, data: reviews })
  } catch (err) { next(err) }
})
