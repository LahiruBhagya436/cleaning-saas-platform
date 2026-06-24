import { Router, Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { authenticate } from '../middleware/auth'
import { AppError } from '../middleware/errorHandler'
import { encryptField } from '../lib/crypto'
import { normalizePersonnummer } from '../lib/validators'

export const userRoutes = Router()
userRoutes.use(authenticate)

userRoutes.get('/me', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where:  { id: req.user!.userId },
      select: {
        id: true, email: true, fullName: true, phone: true, role: true,
        preferredLanguage: true, createdAt: true, personnummerEnc: true,
      },
    })
    if (!user) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'User not found' } })
    const { personnummerEnc, ...rest } = user
    res.json({ success: true, data: { ...rest, hasPersonnummer: !!personnummerEnc } })
  } catch (err) { next(err) }
})

userRoutes.patch('/me', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      fullName:          z.string().min(2).max(200).optional(),
      phone:             z.string().optional(),
      preferredLanguage: z.enum(['sv', 'en']).optional(),
      personnummer:      z.string().optional(),
    })
    const body = schema.parse(req.body)
    const { personnummer, ...rest } = body

    const data: Record<string, unknown> = { ...rest }
    if (personnummer) {
      const normalized = normalizePersonnummer(personnummer)
      if (!normalized) {
        throw new AppError('VALIDATION_ERROR', 'Ange ett giltigt personnummer (ÅÅMMDD-XXXX eller ÅÅÅÅMMDD-XXXX)', 422)
      }
      data.personnummerEnc = encryptField(normalized)
    }

    const user = await prisma.user.update({
      where:  { id: req.user!.userId },
      data,
      select: {
        id: true, email: true, fullName: true, phone: true, role: true,
        preferredLanguage: true, personnummerEnc: true,
      },
    })
    const { personnummerEnc, ...rest2 } = user
    res.json({ success: true, data: { ...rest2, hasPersonnummer: !!personnummerEnc } })
  } catch (err) { next(err) }
})
