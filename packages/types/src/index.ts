// ─── User & Auth ─────────────────────────────────────────────────────────────

export type UserRole = 'customer' | 'staff' | 'coordinator' | 'admin' | 'superadmin'

export interface User {
  id: string
  email: string
  phone: string | null
  fullName: string
  role: UserRole
  preferredLanguage: 'sv' | 'en'
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  fullName: string
  phone?: string
}

// ─── Property ────────────────────────────────────────────────────────────────

export interface Property {
  id: string
  userId: string
  label: string | null
  addressLine1: string
  city: string
  postalCode: string
  areaSqm: number | null
  floors: number
  entryNotes: string | null
  hasPets: boolean
  isPrimary: boolean
  createdAt: string
}

export interface CreatePropertyRequest {
  label?: string
  addressLine1: string
  city: string
  postalCode: string
  areaSqm?: number
  floors?: number
  accessCode?: string
  entryNotes?: string
  hasPets?: boolean
}

// ─── Service ─────────────────────────────────────────────────────────────────

export type ServiceCategory = 'residential' | 'commercial' | 'specialty'

export interface Service {
  id: string
  name: string
  nameSv: string
  category: ServiceCategory
  basePricePerHour: number
  fixedPrice: number | null
  rutEligible: boolean
  vatRate: number
  minDurationMins: number
  isActive: boolean
}

// ─── Booking ─────────────────────────────────────────────────────────────────

export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'

export type RecurrenceType = 'none' | 'weekly' | 'biweekly' | 'monthly'

export interface Booking {
  id: string
  userId: string
  propertyId: string
  staffId: string | null
  scheduledAt: string
  estimatedEndAt: string
  durationMinutes: number
  status: BookingStatus
  recurrence: RecurrenceType
  recurrenceEndDate: string | null
  totalPriceExclVat: number
  vatAmount: number
  rutDeduction: number
  customerPays: number
  notes: string | null
  createdAt: string
  updatedAt: string
  property?: Property
  staff?: User
  items?: BookingItem[]
}

export interface BookingItem {
  id: string
  bookingId: string
  serviceId: string
  quantity: number
  unitPrice: number
  service?: Service
}

export interface CreateBookingRequest {
  propertyId: string
  serviceIds: string[]
  scheduledAt: string
  durationMinutes: number
  recurrence?: RecurrenceType
  recurrenceEndDate?: string
  notes?: string
}

export interface AvailabilitySlot {
  startTime: string
  endTime: string
  available: boolean
  staffCount: number
}

// ─── Invoice & RUT ───────────────────────────────────────────────────────────

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'void'
export type RutClaimStatus = 'pending' | 'submitted' | 'approved' | 'rejected'

export interface Invoice {
  id: string
  bookingId: string
  invoiceNumber: string
  labourCost: number
  materialsCost: number
  vatAmount: number
  rutDeduction: number
  customerPays: number
  status: InvoiceStatus
  issuedAt: string
  dueAt: string
  paidAt: string | null
  pdfUrl: string | null
  rutClaim?: RutClaim
}

export interface RutClaim {
  id: string
  invoiceId: string
  claimAmount: number
  skatteverketRef: string | null
  claimStatus: RutClaimStatus
  submittedAt: string | null
  approvedAt: string | null
  rejectionReason: string | null
}

// ─── Staff ───────────────────────────────────────────────────────────────────

export interface StaffSchedule {
  id: string
  staffId: string
  workDate: string
  startTime: string
  endTime: string
  isAvailable: boolean
}

export interface StaffJob extends Booking {
  property: Property
  accessCode?: string
  checklist: ChecklistItem[]
}

export interface ChecklistItem {
  id: string
  label: string
  completed: boolean
}

// ─── Review ──────────────────────────────────────────────────────────────────

export interface Review {
  id: string
  bookingId: string
  userId: string
  staffId: string
  rating: number
  comment: string | null
  createdAt: string
}

// ─── API Response wrapper ────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: true
  data: T
  meta?: {
    total?: number
    page?: number
    limit?: number
    nextCursor?: string
  }
}

export interface ApiError {
  success: false
  error: {
    code: string
    message: string
    details?: Record<string, string[]>
  }
}

// ─── Admin / Dashboard ───────────────────────────────────────────────────────

export interface DashboardKpis {
  totalBookingsToday: number
  activeStaff: number
  revenueThisMonth: number
  rutPendingCount: number
  newCustomersThisWeek: number
  averageRating: number
}
