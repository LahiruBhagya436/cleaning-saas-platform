import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { AppError } from './errorHandler'

export type UserRole = 'customer' | 'staff' | 'coordinator' | 'admin' | 'superadmin'

export interface AuthPayload {
  userId: string
  email:  string
  role:   UserRole
  companyId: string | null
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace -- required by Express's own
  // type-augmentation pattern; there is no ES2015-module equivalent for this.
  namespace Express {
    interface Request {
      user?: AuthPayload
    }
  }
}

export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    const header = req.headers.authorization
    if (!header?.startsWith('Bearer ')) {
      throw new AppError('UNAUTHORIZED', 'Authentication required', 401)
    }
    const token  = header.slice(7)
    const secret = process.env.JWT_ACCESS_SECRET
    if (!secret) throw new Error('JWT_ACCESS_SECRET not configured')

    const payload = jwt.verify(token, secret) as AuthPayload
    req.user = payload
    next()
  } catch (err) {
    if (err instanceof AppError) return next(err)
    next(new AppError('UNAUTHORIZED', 'Invalid or expired token', 401))
  }
}

export const requireRole = (...roles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new AppError('UNAUTHORIZED', 'Authentication required', 401))
    if (!roles.includes(req.user.role)) return next(new AppError('FORBIDDEN', 'Insufficient permissions', 403))
    next()
  }
}

export const requireStaff    = requireRole('staff', 'coordinator', 'admin', 'superadmin')
export const requireAdmin    = requireRole('coordinator', 'admin', 'superadmin')
export const requireSuperAdmin = requireRole('superadmin')
