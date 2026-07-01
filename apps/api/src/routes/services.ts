import { Router, Request, Response, NextFunction } from 'express'
import { prisma } from '../lib/prisma'
import { optionalAuthenticate } from '../middleware/auth'
import { resolveCompany } from '../middleware/company'

export const serviceRoutes = Router()
// optionalAuthenticate must run first so req.user.companyId is available
// for resolveCompany when a logged-in customer hits this public endpoint
serviceRoutes.use(optionalAuthenticate)
serviceRoutes.use(resolveCompany)

serviceRoutes.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const services = await prisma.service.findMany({
      where: { isActive: true, companyId: req.companyId },
      orderBy: { sortOrder: 'asc' },
    })
    res.json({ success: true, data: services })
  } catch (err) { next(err) }
})

serviceRoutes.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const service = await prisma.service.findFirst({ where: { id: req.params.id, companyId: req.companyId } })
    if (!service) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Service not found' } })
    res.json({ success: true, data: service })
  } catch (err) { next(err) }
})
