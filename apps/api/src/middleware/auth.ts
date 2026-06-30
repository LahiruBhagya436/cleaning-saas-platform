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
  // eslint-disable-next-line @typescript-eslint/no-namespace -- required by Express's own type-augmentation pattern; there is no ES2015-module equivalent for this
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
// Admin-only: was previously letting `coordinator` through too, which is wrong
// for anything that creates/manages accounts (adding staff, etc.) — coordinators
// ("supervisors") can be handed task assignment, never account management.
export const requireAdmin    = requireRole('admin', 'superadmin')
// Admin OR coordinator ("supervisor") — for assigning work to ground-level staff.
export const requireSupervisor = requireRole('coordinator', 'admin', 'superadmin')
export const requireSuperAdmin = requireRole('superadmin')

// Only these two named platform-owner emails may create new ADMIN accounts for
// a company (separate from the `superadmin` role check on the platform router —
// this narrows it down to specific people, not just anyone with that role).
const ADMIN_CREATOR_EMAILS = (process.env.ADMIN_CREATOR_EMAILS ?? '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean)

export const requireAdminCreator = (req: Request, _res: Response, next: NextFunction) => {
  if (!req.user) return next(new AppError('UNAUTHORIZED', 'Authentication required', 401))
  if (!ADMIN_CREATOR_EMAILS.includes(req.user.email.toLowerCase())) {
    return next(new AppError('FORBIDDEN', 'Only authorized platform owners can create admin accounts', 403))
  }
  next()
}
