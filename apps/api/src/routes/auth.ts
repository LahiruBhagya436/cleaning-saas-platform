import { Router, Request, Response, NextFunction } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { AppError } from '../middleware/errorHandler'
import { authenticate } from '../middleware/auth'
import { AuthPayload } from '../middleware/auth'
import { resolveCompany } from '../middleware/company'
import { sendEmail } from '../services/email'

export const authRoutes = Router()

// ── Schemas ───────────────────────────────────────────────────────────────────

const registerSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  fullName: z.string().min(2).max(200),
  phone:    z.string().optional(),
})

const loginSchema = z.object({
  email:    z.string().email(),
  password: z.string(),
})

const registerCompanySchema = z.object({
  companyName:  z.string().min(2).max(200),
  slug: z.string().min(2).max(63)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and hyphens only'),
  contactEmail: z.string().email(),
  contactPhone: z.string().optional(),
  fullName:     z.string().min(2).max(200),
  email:        z.string().email(),
  password:     z.string().min(8, 'Password must be at least 8 characters'),
  phone:        z.string().optional(),
})

const RESERVED_SLUGS = new Set(['www', 'app', 'api', 'admin', 'platform', 'mail', 'static', 'localhost'])

const forgotSchema = z.object({ email: z.string().email() })

const resetSchema = z.object({
  token:       z.string(),
  newPassword: z.string().min(8),
})

// ── Helpers ───────────────────────────────────────────────────────────────────

function issueTokens(payload: AuthPayload) {
  const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET!, {
    expiresIn: (process.env.JWT_ACCESS_EXPIRES_IN ?? '15m') as jwt.SignOptions['expiresIn'],
  })
  const refreshToken = jwt.sign(
    { userId: payload.userId },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN ?? '30d') as jwt.SignOptions['expiresIn'] }
  )
  return { accessToken, refreshToken }
}

function userToPayload(user: { id: string; email: string; role: string; companyId?: string | null }): AuthPayload {
  return {
    userId: user.id,
    email: user.email,
    role: user.role as AuthPayload['role'],
    companyId: user.companyId ?? null,
  }
}

// ── POST /auth/register ───────────────────────────────────────────────────────

authRoutes.post('/register', resolveCompany, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = registerSchema.parse(req.body)

    const existing = await prisma.user.findUnique({ where: { email: body.email } })
    if (existing) throw new AppError('EMAIL_TAKEN', 'Email already registered', 409)

    const passwordHash = await bcrypt.hash(body.password, 12)
    const user = await prisma.user.create({
      data: {
        email: body.email,
        passwordHash,
        fullName: body.fullName,
        phone: body.phone,
        companyId: req.companyId,
      },
    })

    const payload = userToPayload(user)
    const { accessToken, refreshToken } = issueTokens(payload)

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    })

    await sendEmail({
      to: user.email,
      template: 'welcome',
      data: { name: user.fullName },
    })

    res.status(201).json({
      success: true,
      data: {
        user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role },
        accessToken,
        refreshToken,
        expiresIn: 900,
      },
    })
  } catch (err) { next(err) }
})

// ── POST /auth/register-company ───────────────────────────────────────────────
// Onboards a brand-new cleaning company onto the platform: creates the Company
// row plus its first admin user, in one transaction. This is the SaaS signup
// flow — distinct from /register, which adds a customer to an *existing*
// (already-resolved) company.

authRoutes.post('/register-company', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = registerCompanySchema.parse(req.body)
    const slug = body.slug.toLowerCase()

    if (RESERVED_SLUGS.has(slug)) {
      throw new AppError('SLUG_RESERVED', 'This subdomain is reserved, please choose another', 409)
    }

    const [existingSlug, existingEmail] = await Promise.all([
      prisma.company.findUnique({ where: { slug } }),
      prisma.user.findUnique({ where: { email: body.email } }),
    ])
    if (existingSlug) throw new AppError('SLUG_TAKEN', 'That subdomain is already taken', 409)
    if (existingEmail) throw new AppError('EMAIL_TAKEN', 'Email already registered', 409)

    const passwordHash = await bcrypt.hash(body.password, 12)

    const { company, user } = await prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: {
          name:         body.companyName,
          slug,
          contactEmail: body.contactEmail,
          contactPhone: body.contactPhone,
          subscriptionTier:   'starter',
          subscriptionStatus: 'trialing',
          trialEndsAt:  new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14-day trial
        },
      })

      const user = await tx.user.create({
        data: {
          companyId:    company.id,
          email:        body.email,
          passwordHash,
          fullName:     body.fullName,
          phone:        body.phone,
          role:         'admin',
        },
      })

      return { company, user }
    })

    const payload = userToPayload(user)
    const { accessToken, refreshToken } = issueTokens(payload)

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    })

    sendEmail({
      to: user.email,
      template: 'welcome',
      data: { name: user.fullName },
    }).catch(() => {})

    res.status(201).json({
      success: true,
      data: {
        company: { id: company.id, name: company.name, slug: company.slug, trialEndsAt: company.trialEndsAt },
        user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role },
        accessToken,
        refreshToken,
        expiresIn: 900,
      },
    })
  } catch (err) { next(err) }
})

// ── GET /auth/check-slug/:slug — availability check for the signup form ──────

authRoutes.get('/check-slug/:slug', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const slug = req.params.slug.toLowerCase()
    const valid = /^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) && slug.length >= 2 && slug.length <= 63
    if (!valid) return res.json({ success: true, data: { available: false, reason: 'INVALID_FORMAT' } })
    if (RESERVED_SLUGS.has(slug)) return res.json({ success: true, data: { available: false, reason: 'RESERVED' } })

    const existing = await prisma.company.findUnique({ where: { slug } })
    res.json({ success: true, data: { available: !existing, reason: existing ? 'TAKEN' : null } })
  } catch (err) { next(err) }
})

// ── POST /auth/login ──────────────────────────────────────────────────────────

authRoutes.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = loginSchema.parse(req.body)

    const user = await prisma.user.findUnique({ where: { email: body.email } })
    if (!user || !user.passwordHash) {
      throw new AppError('INVALID_CREDENTIALS', 'Email or password is incorrect', 401)
    }
    if (!user.isActive) throw new AppError('ACCOUNT_DISABLED', 'Account is disabled', 403)

    const valid = await bcrypt.compare(body.password, user.passwordHash)
    if (!valid) throw new AppError('INVALID_CREDENTIALS', 'Email or password is incorrect', 401)

    const payload = userToPayload(user)
    const { accessToken, refreshToken } = issueTokens(payload)

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    })

    res.json({
      success: true,
      data: {
        user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role },
        accessToken,
        refreshToken,
        expiresIn: 900,
      },
    })
  } catch (err) { next(err) }
})

// ── POST /auth/oauth-google ───────────────────────────────────────────────────
// Called server-to-server by the Next.js app (NextAuth's `jwt` callback) right
// after Google verifies the user — never called directly from the browser.
// Google sign-in previously had no backend integration at all: the frontend
// would set role/accessToken/refreshToken from `user`, but for the Google
// provider that object never had them, so every Google-authenticated session
// ended up with role=undefined and accessToken="undefined" — breaking the
// admin/platform role gates (stuck on a loading spinner) and every subsequent
// authenticated API call. This finds-or-creates the user by Google ID/email
// and issues real backend tokens, the same way /login does.

const oauthSchema = z.object({
  email:     z.string().email(),
  fullName:  z.string().min(1).max(200),
  googleId:  z.string().min(1),
})

authRoutes.post('/oauth-google', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const internalSecret = req.header('x-internal-secret')
    if (!internalSecret || internalSecret !== process.env.INTERNAL_AUTH_SECRET) {
      throw new AppError('UNAUTHORIZED', 'Unauthorized', 401)
    }

    const body = oauthSchema.parse(req.body)

    let user = await prisma.user.findUnique({ where: { googleId: body.googleId } })

    if (!user) {
      // Not linked yet — match by email so an existing password-based account
      // gets linked instead of creating a duplicate user, then fall back to
      // creating a brand-new (passwordless) customer account.
      const existingByEmail = await prisma.user.findUnique({ where: { email: body.email } })
      if (existingByEmail) {
        if (!existingByEmail.isActive) throw new AppError('ACCOUNT_DISABLED', 'Account is disabled', 403)
        user = await prisma.user.update({
          where: { id: existingByEmail.id },
          data: { googleId: body.googleId },
        })
      } else {
        user = await prisma.user.create({
          data: {
            email:    body.email,
            fullName: body.fullName,
            googleId: body.googleId,
            role:     'customer',
          },
        })
        sendEmail({
          to: user.email,
          template: 'welcome',
          data: { name: user.fullName },
        }).catch(() => {})
      }
    } else if (!user.isActive) {
      throw new AppError('ACCOUNT_DISABLED', 'Account is disabled', 403)
    }

    const payload = userToPayload(user)
    const { accessToken, refreshToken } = issueTokens(payload)

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    })

    res.json({
      success: true,
      data: {
        user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role },
        accessToken,
        refreshToken,
        expiresIn: 900,
      },
    })
  } catch (err) { next(err) }
})

// ── POST /auth/refresh ────────────────────────────────────────────────────────

authRoutes.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body
    if (!refreshToken) throw new AppError('UNAUTHORIZED', 'Refresh token required', 401)

    const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken } })
    if (!stored || stored.expiresAt < new Date()) {
      throw new AppError('UNAUTHORIZED', 'Invalid or expired refresh token', 401)
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as { userId: string }
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } })
    if (!user || !user.isActive) throw new AppError('UNAUTHORIZED', 'User not found', 401)

    // Rotate refresh token
    await prisma.refreshToken.delete({ where: { id: stored.id } })
    const payload = userToPayload(user)
    const tokens = issueTokens(payload)

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: tokens.refreshToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    })

    res.json({ success: true, data: { ...tokens, expiresIn: 900 } })
  } catch (err) { next(err) }
})

// ── POST /auth/logout ─────────────────────────────────────────────────────────

authRoutes.post('/logout', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body
    if (refreshToken) {
      await prisma.refreshToken.deleteMany({ where: { token: refreshToken } })
    }
    // Invalidate all tokens for extra security (optional)
    // await prisma.refreshToken.deleteMany({ where: { userId: req.user!.userId } })
    res.status(204).send()
  } catch (err) { next(err) }
})

// ── POST /auth/change-password ────────────────────────────────────────────────
// (authenticated — for a logged-in user changing their own password from the
// account/profile page, as opposed to the forgot/reset flow below)

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password required'),
  newPassword:      z.string().min(8, 'Password must be at least 8 characters'),
})

authRoutes.post('/change-password', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body)
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } })
    if (!user || !user.passwordHash) {
      throw new AppError('INVALID_CREDENTIALS', 'Current password is incorrect', 401)
    }
    const valid = await bcrypt.compare(currentPassword, user.passwordHash)
    if (!valid) throw new AppError('INVALID_CREDENTIALS', 'Current password is incorrect', 401)

    const passwordHash = await bcrypt.hash(newPassword, 12)
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } })
    res.status(204).send()
  } catch (err) { next(err) }
})

// ── POST /auth/forgot-password ────────────────────────────────────────────────

authRoutes.post('/forgot-password', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = forgotSchema.parse(req.body)
    const user = await prisma.user.findUnique({ where: { email } })
    // Always return 204 — don't confirm if email exists
    if (user) {
      const resetToken = jwt.sign({ userId: user.id, purpose: 'reset' }, process.env.JWT_ACCESS_SECRET!, { expiresIn: '1h' })
      await sendEmail({
        to: user.email,
        template: 'password_reset',
        data: { name: user.fullName, resetUrl: `${process.env.WEB_URL}/reset-password?token=${resetToken}` },
      })
    }
    res.status(204).send()
  } catch (err) { next(err) }
})

// ── POST /auth/reset-password ─────────────────────────────────────────────────

authRoutes.post('/reset-password', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token, newPassword } = resetSchema.parse(req.body)
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as { userId: string; purpose: string }
    if (decoded.purpose !== 'reset') throw new AppError('INVALID_TOKEN', 'Invalid reset token', 400)

    const passwordHash = await bcrypt.hash(newPassword, 12)
    await prisma.user.update({ where: { id: decoded.userId }, data: { passwordHash } })
    await prisma.refreshToken.deleteMany({ where: { userId: decoded.userId } })

    res.status(204).send()
  } catch (err) {
    if ((err as { name?: string }).name === 'JsonWebTokenError') {
      return next(new AppError('INVALID_TOKEN', 'Invalid or expired reset token', 400))
    }
    next(err)
  }
})

// ── GET /auth/me ──────────────────────────────────────────────────────────────

authRoutes.get('/me', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { id: true, email: true, fullName: true, phone: true, role: true, preferredLanguage: true, createdAt: true },
    })
    if (!user) throw new AppError('NOT_FOUND', 'User not found', 404)
    res.json({ success: true, data: user })
  } catch (err) { next(err) }
})
