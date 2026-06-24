import { Router, Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { authenticate } from '../middleware/auth'

export const propertyRoutes = Router()
propertyRoutes.use(authenticate)

const schema = z.object({
  label:        z.string().max(100).optional(),
  addressLine1: z.string().min(5).max(200),
  city:         z.string().max(100).default('Stockholm'),
  postalCode:   z.string().max(10),
  areaSqm:      z.number().int().positive().optional(),
  floors:       z.number().int().min(1).default(1),
  entryNotes:   z.string().max(500).optional(),
  hasPets:      z.boolean().default(false),
})

propertyRoutes.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const properties = await prisma.property.findMany({
      where:   { userId: req.user!.userId },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
    })
    res.json({ success: true, data: properties })
  } catch (err) { next(err) }
})

propertyRoutes.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body  = schema.parse(req.body)
    const count = await prisma.property.count({ where: { userId: req.user!.userId } })
    const property = await prisma.property.create({
      data: { ...body, userId: req.user!.userId, isPrimary: count === 0 },
    })
    res.status(201).json({ success: true, data: property })
  } catch (err) { next(err) }
})

propertyRoutes.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body     = schema.partial().parse(req.body)
    const existing = await prisma.property.findFirst({ where: { id: req.params.id, userId: req.user!.userId } })
    if (!existing) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Property not found' } })
    const updated  = await prisma.property.update({ where: { id: req.params.id }, data: body })
    res.json({ success: true, data: updated })
  } catch (err) { next(err) }
})

propertyRoutes.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const existing = await prisma.property.findFirst({ where: { id: req.params.id, userId: req.user!.userId } })
    if (!existing) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Property not found' } })
    await prisma.property.delete({ where: { id: req.params.id } })
    res.status(204).send()
  } catch (err) { next(err) }
})
