'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { sv } from 'date-fns/locale'
import { CalendarDays, Clock, MapPin, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { adminApi } from '@/lib/api'
import { BOOKING_STATUS_LABELS, formatSEK } from '@/lib/utils'
import { Badge } from '@/components/dashboard/Badge'

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([])
  const [workers,  setWorkers]  = useState<any[]>([])
  const [loading,  setLoading]  = useState(true)
  const [filter,   setFilter]   = useState<string>('all')
  const [assigning,setAssigning]= useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const [bookingsRes, workersRes] = await Promise.all([
        adminApi.bookings({ limit: 100 }),
        adminApi.workers(),
      ])
      setBookings(bookingsRes.data ?? [])
      setWorkers((workersRes.data ?? []).filter((w: any) => w.isActive))
    } catch {
      toast.error('Kunde inte hämta bokningar.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleAssign = async (bookingId: string, staffId: string) => {
    setAssigning(bookingId)
    try {
      const updated = await adminApi.assignBooking(bookingId, staffId || null)
      setBookings((prev) => prev.map((b) => (b.id === bookingId ? updated.data : b)))
      toast.success(staffId ? 'Personal tilldelad.' : 'Tilldelning borttagen.')
    } catch (err: any) {
      toast.error(err?.message ?? 'Kunde inte tilldela personal.')
    } finally {
      setAssigning(null)
    }
  }

  const FILTERS = [
    { key: 'all',         label: 'Alla' },
    { key: 'pending',     label: 'Väntar' },
    { key: 'confirmed',   label: 'Bekräftade' },
    { key: 'in_progress', label: 'Pågår' },
    { key: 'completed',   label: 'Avslutade' },
    { key: 'cancelled',   label: 'Avbokade' },
  ]

  const filtered = filter === 'all' ? bookings : bookings.filter((b) => b.status === filter)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-neutral-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl text-neutral-900">Bokningar</h1>
        <p className="text-sm text-neutral-500 mt-1">Tilldela personal till bokningar.</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              filter === key
                ? 'bg-brand-600 text-white'
                : 'bg-white border border-neutral-200 text-neutral-600 hover:border-neutral-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-dashed border-neutral-200 rounded-xl p-10 text-center text-sm text-neutral-500">
          Inga bokningar i denna kategori.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((b) => {
            const status   = BOOKING_STATUS_LABELS[b.status]
            const start    = new Date(b.scheduledAt)
            const end      = new Date(b.estimatedEndAt)
            const locked   = ['completed', 'cancelled'].includes(b.status)

            return (
              <div key={b.id} className="bg-white border border-neutral-200 rounded-xl p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <Badge className={status?.color ?? ''}>{status?.label ?? b.status}</Badge>
                      <span className="text-sm font-medium text-neutral-900">{b.customer?.fullName ?? 'Kund'}</span>
                      <span className="text-xs text-neutral-400">{b.customer?.email}</span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                      <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                        <CalendarDays size={12} />
                        <span className="capitalize">{format(start, 'EEE d MMM yyyy', { locale: sv })}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                        <Clock size={12} />
                        <span>{format(start, 'HH:mm')}–{format(end, 'HH:mm')}</span>
                      </div>
                      {b.property && (
                        <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                          <MapPin size={12} />
                          <span>{b.property.addressLine1}, {b.property.postalCode} {b.property.city}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="font-display text-lg text-brand-700">{formatSEK(Number(b.customerPays))}</p>
                  </div>
                </div>

                {/* Assignment row */}
                <div className="flex items-center gap-3 mt-4 pt-4 border-t border-neutral-100">
                  <span className="text-xs text-neutral-500 shrink-0">Tilldelad personal</span>
                  <select
                    value={b.staff?.id ?? ''}
                    disabled={locked || assigning === b.id}
                    onChange={(e) => handleAssign(b.id, e.target.value)}
                    className="text-sm border border-neutral-200 rounded-lg px-3 py-1.5 bg-white disabled:bg-neutral-50 disabled:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-200"
                  >
                    <option value="">— Ej tilldelad —</option>
                    {workers.map((w) => (
                      <option key={w.id} value={w.id}>{w.fullName}</option>
                    ))}
                  </select>
                  {assigning === b.id && <Loader2 size={14} className="animate-spin text-neutral-400" />}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
