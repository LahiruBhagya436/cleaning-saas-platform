import { Request, Response, NextFunction } from 'express'
import { prisma } from '../lib/prisma'
import { AppError } from './errorHandler'

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace -- required by Express's own type-augmentation pattern; there is no ES2015-module equivalent for this
  namespace Express {
    interface Request {
      companyId?: string
    }
  }
}

/**
 * Works out which company a request belongs to.
 *
 * Resolution order:
 *  1. Already-authenticated user's companyId (set by `authenticate`)
 *  2. `X-Company-Slug` header (used by the company signup / switch-tenant flows)
 *  3. Subdomain of the Host header, e.g. `acme.platform.se` -> slug "acme"
 *  4. Fallback: if exactly one company exists in the database (today's
 *     single-tenant deployment), use it. This keeps the existing web app
 *     working with zero changes until subdomain routing ships.
 */
export async function resolveCompany(req: Request, _res: Response, next: NextFunction) {
  try {
    if (req.user?.companyId) {
      req.companyId = req.user.companyId
      return next()
    }

    const headerSlug = (req.headers['x-company-slug'] as string | undefined)?.trim()
    const bodySlug = (req.body?.companySlug as string | undefined)?.trim()
    let slug = headerSlug || bodySlug

    if (!slug) {
      // Strip the port (e.g. "localhost:4000" -> "localhost") before matching,
      // otherwise a local dev request with a port in the Host header slips
      // past the "localhost" / IP checks below and gets misread as a slug.
      const host = (req.headers.host ?? '').split(':')[0]
      // Infra/platform hosts (PaaS default domains, IPs, localhost) are never
      // tenant subdomains — treating them as one breaks single-tenant deployments
      // hosted directly on a provider's *.onrender.com / *.vercel.app domain.
      const isInfraHost =
        /\.(onrender\.com|render\.com|vercel\.app|herokuapp\.com|railway\.app|fly\.dev|run\.app)$/i.test(host) ||
        host === 'localhost' ||
        /^\d{1,3}(\.\d{1,3}){3}$/.test(host)
      const sub = host.split('.')[0]
      if (!isInfraHost && sub && sub !== 'www' && sub !== 'localhost' && !sub.match(/^\d+$/)) {
        slug = sub
      }
    }

    if (slug) {
      const company = await prisma.company.findUnique({ where: { slug } })
      if (!company) throw new AppError('COMPANY_NOT_FOUND', `No company found for "${slug}"`, 404)
      if (!company.isActive) throw new AppError('COMPANY_INACTIVE', 'This company account is inactive', 403)
      req.companyId = company.id
      return next()
    }

    // Dev/back-compat fallback: single-tenant deployments
    const companies = await prisma.company.findMany({ select: { id: true }, take: 2 })
    if (companies.length === 1) {
      req.companyId = companies[0].id
      return next()
    }

    throw new AppError('COMPANY_REQUIRED', 'Unable to determine which company this request belongs to', 400)
  } catch (err) {
    next(err)
  }
}
