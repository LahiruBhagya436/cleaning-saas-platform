import { resolveCompany } from './company'
import { prisma } from '../lib/prisma'

jest.mock('../lib/prisma', () => ({
  prisma: {
    company: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
  },
}))

function mockReq(overrides: Partial<{ host: string; user: any; headers: Record<string, string> }> = {}) {
  return {
    headers: { host: overrides.host ?? 'localhost:4000', ...(overrides.headers ?? {}) },
    user: overrides.user,
    body: {},
  } as any
}

function mockRes() {
  return {} as any
}

describe('resolveCompany', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('uses the authenticated user companyId when present', async () => {
    const req = mockReq({ user: { companyId: 'company-1' } })
    const next = jest.fn()

    await resolveCompany(req, mockRes(), next)

    expect(req.companyId).toBe('company-1')
    expect(next).toHaveBeenCalledWith()
    expect(prisma.company.findUnique).not.toHaveBeenCalled()
  })

  it('resolves via X-Company-Slug header', async () => {
    ;(prisma.company.findUnique as jest.Mock).mockResolvedValue({ id: 'company-2', isActive: true })
    const req = mockReq({ headers: { 'x-company-slug': 'acme' } })
    const next = jest.fn()

    await resolveCompany(req, mockRes(), next)

    expect(prisma.company.findUnique).toHaveBeenCalledWith({ where: { slug: 'acme' } })
    expect(req.companyId).toBe('company-2')
    expect(next).toHaveBeenCalledWith()
  })

  it('resolves via real tenant subdomain', async () => {
    ;(prisma.company.findUnique as jest.Mock).mockResolvedValue({ id: 'company-3', isActive: true })
    const req = mockReq({ host: 'acme.platform.se' })
    const next = jest.fn()

    await resolveCompany(req, mockRes(), next)

    expect(prisma.company.findUnique).toHaveBeenCalledWith({ where: { slug: 'acme' } })
    expect(req.companyId).toBe('company-3')
  })

  // Regression test for the production bug fixed on 2026-06-26: the API's own
  // PaaS hostname (e.g. Render's *.onrender.com) was being parsed as a tenant
  // subdomain, causing a 404 COMPANY_NOT_FOUND on every request and breaking
  // the booking flow for single-tenant deployments.
  it.each([
    'cleaning-api-eyw0.onrender.com',
    'my-app.vercel.app',
    'my-app.herokuapp.com',
    'my-app.railway.app',
    'my-app.fly.dev',
    'my-app.run.app',
    '127.0.0.1:4000',
    'localhost',
  ])('treats PaaS/infra host "%s" as no slug and falls back to single-tenant lookup', async (host) => {
    ;(prisma.company.findMany as jest.Mock).mockResolvedValue([{ id: 'only-company' }])
    const req = mockReq({ host })
    const next = jest.fn()

    await resolveCompany(req, mockRes(), next)

    expect(prisma.company.findUnique).not.toHaveBeenCalled()
    expect(req.companyId).toBe('only-company')
    expect(next).toHaveBeenCalledWith()
  })

  it('falls back to the single existing company when no slug can be determined', async () => {
    ;(prisma.company.findMany as jest.Mock).mockResolvedValue([{ id: 'only-company' }])
    const req = mockReq({ host: 'localhost:4000' })
    const next = jest.fn()

    await resolveCompany(req, mockRes(), next)

    expect(req.companyId).toBe('only-company')
    expect(next).toHaveBeenCalledWith()
  })

  it('errors with COMPANY_REQUIRED when multiple companies exist and no slug is given', async () => {
    ;(prisma.company.findMany as jest.Mock).mockResolvedValue([{ id: 'a' }, { id: 'b' }])
    const req = mockReq({ host: 'localhost:4000' })
    const next = jest.fn()

    await resolveCompany(req, mockRes(), next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ code: 'COMPANY_REQUIRED' }))
  })

  it('errors with COMPANY_NOT_FOUND for an unknown slug', async () => {
    ;(prisma.company.findUnique as jest.Mock).mockResolvedValue(null)
    const req = mockReq({ headers: { 'x-company-slug': 'ghost' } })
    const next = jest.fn()

    await resolveCompany(req, mockRes(), next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ code: 'COMPANY_NOT_FOUND' }))
  })

  it('errors with COMPANY_INACTIVE for a disabled company', async () => {
    ;(prisma.company.findUnique as jest.Mock).mockResolvedValue({ id: 'company-4', isActive: false })
    const req = mockReq({ headers: { 'x-company-slug': 'acme' } })
    const next = jest.fn()

    await resolveCompany(req, mockRes(), next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ code: 'COMPANY_INACTIVE' }))
  })
})
