'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { sv } from 'date-fns/locale'
import { CalendarDays, Users, Banknote, FileWarning, ArrowRight, Loader2, MapPin } from 'lucide-react'
import { adminApi } from '@/lib/api'
import { formatSEK, BOOKING_STATUS_LABELS } from '@/lib/utils'
import { Badge } from '@/components/dashboard/Badge'

export default function AdminDashboardPage() {
  const [stats,    setStats]    = useState<any>(null)
  const [bookings, setBookings] = useState<any[]>([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    (async () => {
      try {
        const [dashRes, bookingsRes] = await Promise.all([
          adminApi.dashboard(),
          adminApi.bookings({ limit: 8 }),
        ])
        setStats(dashRes.data)
        setBookings(bookingsRes.data ?? [])
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const unassigned = bookings.filter((b) => !b.staff && b.status !== 'cancelled')

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-neutral-400" />
      </div>
    )
  }

  const CARDS = [
    { label: 'Bokningar idag',     value: stats?.totalBookingsToday ?? 0,                        icon: CalendarDays, color: 'text-brand-600 bg-brand-50' },
    { label: 'Aktiv personal',     value: stats?.activeStaff ?? 0,                                icon: Users,        color: 'text-teal-600 bg-teal-50'   },
    { label: 'Intäkter denna mån', value: formatSEK(stats?.revenueThisMonth ?? 0, true),           icon: Banknote,     color: 'text-amber-600 bg-amber-50' },
    { label: 'RUT väntande',       value: stats?.rutPendingCount ?? 0,                             icon: FileWarning,  color: 'text-red-600 bg-red-50'     },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl text-neutral-900">Admin — Översikt</h1>
        <p className="text-sm text-neutral-500 mt-1">Status för bokningar, personal och intäkter.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {CARDS.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white border border-neutral-200 rounded-xl p-4">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${color}`}>
              <Icon size={16} />
            </div>
            <p className="font-display text-2xl text-neutral-900">{value}</p>
            <p className="text-xs text-neutral-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Unassigned bookings warning */}
      {unassigned.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-amber-800">
              {unassigned.length} bokning{unassigned.length > 1 ? 'ar' : ''} utan tilldelad personal
            </p>
            <p className="text-xs text-amber-600 mt-0.5">Tilldela en städare så snart som möjligt.</p>
          </div>
          <Link href="/admin/bookings" className="text-xs font-medium text-amber-700 hover:underline whitespace-nowrap flex items-center gap-1">
            Tilldela nu <ArrowRight size={12} />
          </Link>
        </div>
      )}

      {/* Recent bookings */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-sans font-medium text-neutral-900">Senaste bokningar</h2>
          <Link href="/admin/bookings" className="text-xs text-brand-600 hover:underline flex items-center gap-1">
            Se alla <ArrowRight size={12} />
          </Link>
        </div>

        <div className="space-y-3">
          {bookings.map((b) => {
            const status = BOOKING_STATUS_LABELS[b.status]
            const date   = new Date(b.scheduledAt)
            return (
              <div key={b.id} className="bg-white border border-neutral-200 rounded-xl p-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <Badge className={status?.color ?? ''}>{status?.label ?? b.status}</Badge>
                    <span className="text-sm font-medium text-neutral-900">{b.customer?.fullName ?? 'Kund'}</span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-500">
                    <span className="capitalize">{format(date, "EEE d MMM 'kl.' HH:mm", { locale: sv })}</span>
                    {b.property && (
                      <span className="flex items-center gap-1"><MapPin size={11} />{b.property.addressLine1}</span>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-neutral-500">Personal</p>
                  <p className="text-sm font-medium text-neutral-900">
                    {b.staff?.fullName ?? <span className="text-amber-600">Ej tilldelad</span>}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
