import axios, { AxiosError, AxiosInstance } from 'axios'
import { getSession } from 'next-auth/react'

// ── Create axios instance ─────────────────────────────────────────────────────
const api: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/v1',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

// ── Request interceptor — attach JWT token ────────────────────────────────────
api.interceptors.request.use(async (config) => {
  // Only in browser
  if (typeof window !== 'undefined') {
    const session = await getSession()
    if (session?.accessToken) {
      config.headers.Authorization = `Bearer ${session.accessToken}`
    }
  }
  return config
})

// ── Response interceptor — handle errors ──────────────────────────────────────
api.interceptors.response.use(
  (response) => response.data,
  (error: AxiosError<{ error: { code: string; message: string } }>) => {
    const message =
      error.response?.data?.error?.message ??
      error.message ??
      'An unexpected error occurred'
    return Promise.reject(new Error(message))
  }
)

// ── Type helpers ──────────────────────────────────────────────────────────────
interface ApiResponse<T> { success: true; data: T }

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  register: (data: { email: string; password: string; fullName: string; phone?: string }) =>
    api.post<any, ApiResponse<{ user: any; accessToken: string; refreshToken: string }>>('/auth/register', data),

  registerCompany: (data: {
    companyName: string
    slug: string
    contactEmail: string
    contactPhone?: string
    fullName: string
    email: string
    password: string
    phone?: string
  }) =>
    api.post<any, ApiResponse<{ company: any; user: any; accessToken: string; refreshToken: string }>>(
      '/auth/register-company',
      data
    ),

  checkSlug: (slug: string) =>
    api.get<any, ApiResponse<{ available: boolean; reason: string | null }>>(
      `/auth/check-slug/${encodeURIComponent(slug)}`
    ),

  login: (data: { email: string; password: string }) =>
    api.post<any, ApiResponse<{ user: any; accessToken: string; refreshToken: string }>>('/auth/login', data),

  me: () =>
    api.get<any, ApiResponse<any>>('/auth/me'),

  logout: (refreshToken: string) =>
    api.post('/auth/logout', { refreshToken }),

  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),

  resetPassword: (token: string, newPassword: string) =>
    api.post('/auth/reset-password', { token, newPassword }),

  changePassword: (currentPassword: string, newPassword: string) =>
    api.post('/auth/change-password', { currentPassword, newPassword }),
}

// ── Users (own profile) ────────────────────────────────────────────────────────
export const usersApi = {
  me: () =>
    api.get<any, ApiResponse<{
      id: string; email: string; fullName: string; phone: string | null
      role: string; preferredLanguage: string; hasPersonnummer: boolean
    }>>('/users/me'),

  update: (data: { fullName?: string; phone?: string; preferredLanguage?: string; personnummer?: string }) =>
    api.patch<any, ApiResponse<{ hasPersonnummer: boolean }>>('/users/me', data),
}

// ── Services ──────────────────────────────────────────────────────────────────
export const servicesApi = {
  list: () =>
    api.get<any, ApiResponse<any[]>>('/services'),

  get: (id: string) =>
    api.get<any, ApiResponse<any>>(`/services/${id}`),
}

// ── Properties ────────────────────────────────────────────────────────────────
export const propertiesApi = {
  list: () =>
    api.get<any, ApiResponse<any[]>>('/properties'),

  create: (data: any) =>
    api.post<any, ApiResponse<any>>('/properties', data),

  update: (id: string, data: any) =>
    api.patch<any, ApiResponse<any>>(`/properties/${id}`, data),

  delete: (id: string) =>
    api.delete(`/properties/${id}`),
}

// ── Bookings ──────────────────────────────────────────────────────────────────
export const bookingsApi = {
  list: (params?: { status?: string; limit?: number }) =>
    api.get<any, ApiResponse<any[]>>('/bookings', { params }),

  get: (id: string) =>
    api.get<any, ApiResponse<any>>(`/bookings/${id}`),

  create: (data: {
    propertyId: string
    serviceIds: string[]
    scheduledAt: string
    durationMinutes: number
    recurrence?: string
    notes?: string
  }) =>
    api.post<any, ApiResponse<any>>('/bookings', data),

  update: (id: string, data: any) =>
    api.patch<any, ApiResponse<any>>(`/bookings/${id}`, data),

  cancel: (id: string, reason?: string) =>
    api.delete(`/bookings/${id}`, { data: { cancellationReason: reason } }),

  availability: (params: {
    date: string
    durationMinutes: number
    serviceIds?: string
  }) =>
    api.get<any, ApiResponse<any[]>>('/bookings/availability', { params }),
}

// ── Invoices ──────────────────────────────────────────────────────────────────
export const invoicesApi = {
  list: () =>
    api.get<any, ApiResponse<any[]>>('/invoices'),

  get: (id: string) =>
    api.get<any, ApiResponse<any>>(`/invoices/${id}`),

  checkout: (id: string) =>
    api.post<any, ApiResponse<{ url: string; sessionId: string }>>(`/invoices/${id}/checkout`),

  confirm: (id: string, sessionId: string) =>
    api.post<any, ApiResponse<{ status: string }>>(`/invoices/${id}/confirm`, { sessionId }),
}

// ── Reviews ───────────────────────────────────────────────────────────────────
export const reviewsApi = {
  list: () =>
    api.get<any, ApiResponse<any[]>>('/reviews'),

  create: (data: { bookingId: string; rating: number; comment?: string }) =>
    api.post<any, ApiResponse<any>>('/reviews', data),
}

// ── Admin ─────────────────────────────────────────────────────────────────────
export const adminApi = {
  dashboard: () =>
    api.get<any, ApiResponse<any>>('/admin/dashboard'),

  bookings: (params?: { status?: string; limit?: number }) =>
    api.get<any, ApiResponse<any[]>>('/admin/bookings', { params }),

  staff: () =>
    api.get<any, ApiResponse<any[]>>('/staff'),

  // Workers list with schedules, hours, and assigned jobs
  workers: () =>
    api.get<any, ApiResponse<any[]>>('/admin/staff'),

  // Assign or unassign (staffId: null) a worker to a booking
  assignBooking: (bookingId: string, staffId: string | null) =>
    api.patch<any, ApiResponse<any>>(`/admin/bookings/${bookingId}/assign`, { staffId }),

  // Add/update a single work day for a staff member
  addStaffSchedule: (staffId: string, data: {
    workDate: string
    startTime: string
    endTime: string
    isAvailable?: boolean
    notes?: string
  }) =>
    api.post<any, ApiResponse<any>>(`/admin/staff/${staffId}/schedule`, data),

  deleteStaffSchedule: (staffId: string, scheduleId: string) =>
    api.delete(`/admin/staff/${staffId}/schedule/${scheduleId}`),
}

// ── Stripe Connect (per-company payment onboarding) ───────────────────────────
export const stripeConnectApi = {
  status: () =>
    api.get<any, ApiResponse<{
      connected: boolean
      onboarded: boolean
      chargesEnabled?: boolean
      payoutsEnabled?: boolean
      detailsSubmitted?: boolean
      requirementsDue?: string[]
    }>>('/admin/stripe/status'),

  onboard: () =>
    api.post<any, ApiResponse<{ url: string }>>('/admin/stripe/onboard'),

  dashboardLink: () =>
    api.post<any, ApiResponse<{ url: string }>>('/admin/stripe/dashboard-link'),
}

// ── Platform (super-admin only, cross-company) ────────────────────────────────
export const platformApi = {
  overview: () =>
    api.get<any, ApiResponse<{
      companyCount: number
      activeCompanyCount: number
      trialingCount: number
      totalUsers: number
      totalBookings: number
      paidInvoiceCount: number
      gmv: number
      estimatedPlatformRevenue: number
      platformFeePercent: number
    }>>('/platform/overview'),

  companies: () =>
    api.get<any, ApiResponse<any[]>>('/platform/companies'),

  company: (id: string) =>
    api.get<any, ApiResponse<any>>(`/platform/companies/${id}`),

  updateCompany: (id: string, data: { isActive?: boolean; subscriptionTier?: string; subscriptionStatus?: string }) =>
    api.patch<any, ApiResponse<any>>(`/platform/companies/${id}`, data),

  companyStripe: (id: string) =>
    api.get<any, ApiResponse<any>>(`/platform/companies/${id}/stripe`),
}

// ── RUT claims (admin-facing) ──────────────────────────────────────────────────
export interface RutClaim {
  id: string
  invoiceId: string
  invoiceNumber: string
  customerName: string
  customerEmail: string
  claimAmount: number
  claimStatus: 'pending' | 'submitted' | 'approved' | 'rejected'
  skatteverketRef: string | null
  rejectionReason: string | null
  retryCount: number
  submittedAt: string | null
  approvedAt: string | null
  maskedPersonnummer: string
  bookingDate: string
  createdAt: string
}

export interface MissingPersonnummerInvoice {
  invoiceId: string
  invoiceNumber: string
  customerName: string
  customerEmail: string
  rutDeduction: number
}

export const rutClaimsApi = {
  list: (status?: string) =>
    api.get<any, ApiResponse<{ claims: RutClaim[]; missingPersonnummer: MissingPersonnummerInvoice[] }>>(
      '/admin/rut-claims',
      { params: status ? { status } : {} }
    ),

  update: (id: string, data: { claimStatus?: string; skatteverketRef?: string; rejectionReason?: string }) =>
    api.patch<any, ApiResponse<any>>(`/admin/rut-claims/${id}`, data),

  // Returns a raw Blob (not wrapped in ApiResponse) because of the blob responseType.
  exportCsv: () =>
    api.get('/admin/rut-claims/export.csv', { responseType: 'blob' }) as unknown as Promise<Blob>,
}

export default api
