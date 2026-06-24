import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import morgan from 'morgan'
import { rateLimit } from 'express-rate-limit'

import { errorHandler } from './middleware/errorHandler'
import { notFound } from './middleware/notFound'
import { authRoutes } from './routes/auth'
import { userRoutes } from './routes/users'
import { propertyRoutes } from './routes/properties'
import { bookingRoutes } from './routes/bookings'
import { serviceRoutes } from './routes/services'
import { invoiceRoutes } from './routes/invoices'
import { staffRoutes } from './routes/staff'
import { adminRoutes } from './routes/admin'
import { reviewRoutes } from './routes/reviews'
import { webhookRoutes } from './routes/webhooks'
import { connectRoutes } from './routes/connect'
import { platformRoutes } from './routes/platform'
import { rutClaimRoutes } from './routes/rutClaims'
import { setupCronJobs } from './jobs'

const app = express()
const PORT = process.env.PORT ?? 4000

// ── Trust proxy (for rate limiter behind Fly.io / Nginx) ────────────────────
app.set('trust proxy', 1)

// ── Security headers ─────────────────────────────────────────────────────────
app.use(helmet())

// ── CORS ─────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: [
    process.env.WEB_URL ?? 'http://localhost:3000',
    'http://localhost:3001', // admin dev
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))

// ── Stripe webhook must receive raw body ─────────────────────────────────────
app.use('/v1/webhooks', express.raw({ type: 'application/json' }))
app.use('/v1/webhooks', webhookRoutes)

// ── General middleware ────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(compression())
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'))

// ── Global rate limiter ───────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests' } },
})
app.use(limiter)

// ── Strict auth rate limiter ──────────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, error: { code: 'AUTH_RATE_LIMITED', message: 'Too many auth attempts' } },
})

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), env: process.env.NODE_ENV })
})

// ── API routes ────────────────────────────────────────────────────────────────
const v1 = '/v1'
app.use(`${v1}/auth`,       authLimiter, authRoutes)
app.use(`${v1}/users`,      userRoutes)
app.use(`${v1}/properties`, propertyRoutes)
app.use(`${v1}/bookings`,   bookingRoutes)
app.use(`${v1}/services`,   serviceRoutes)
app.use(`${v1}/invoices`,   invoiceRoutes)
app.use(`${v1}/staff`,      staffRoutes)
app.use(`${v1}/admin`,      adminRoutes)
app.use(`${v1}/admin/stripe`, connectRoutes)
app.use(`${v1}/reviews`,    reviewRoutes)
app.use(`${v1}/platform`,   platformRoutes)
app.use(`${v1}/admin/rut-claims`, rutClaimRoutes)

// ── 404 & error handlers ─────────────────────────────────────────────────────
app.use(notFound)
app.use(errorHandler)

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.info(`🚀 API running on http://localhost:${PORT}`)
  console.info(`   Environment: ${process.env.NODE_ENV}`)
  setupCronJobs()
})

export default app
