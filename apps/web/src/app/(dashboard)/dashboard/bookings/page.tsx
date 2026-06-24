'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { sv } from 'date-fns/locale'
import {
  CalendarDays, Clock, MapPin, Plus,
  RefreshCw, X, ChevronRight, Loader2
} from 'lucide-react'
import { toast } from 'sonner'
import { bookingsApi } from '@/lib/api'
import { formatSEK, BOOKING_STATUS_LABELS } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/dashboard/Badge'
import { EmptyState } from '@/components/dashboard/EmptyState'
import { CancelModal } from '@/components/dashboard/CancelModal'

export default function BookingsPage() {
  const [bookings,    setBookings]    = useState<any[]>([])
  const [loading,     setLoading]     = useState(true)
  const [filter,      setFilter]      = useState<string>('all')
  const [cancelTarget,setCancelTarget]= useState<any>(null)

  const fetchBookings = async () => {
    setLoading(true)
    try {
      const res = await bookingsApi.list({ limit: 50 })
      setBookings(res.data ?? [])
    } catch {
      toast.error('Kunde inte hämta bokningar.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchBookings() }, [])

  const handleCancel = async (bookingId: string, reason: string) => {
    try {
      await bookingsApi.cancel(bookingId, reason)
      toast.success('Bokning avbokad.')
      setCancelTarget(null)
      fetchBookings()
    } catch (err: any) {
      toast.error(err?.message ?? 'Kunde inte avboka.')
    }
  }

  const FILTERS = [
    { key: 'all',         label: 'Alla' },
    { key: 'confirmed',   label: 'Bekräftade' },
    { key: 'completed',   label: 'Avslutade' },
    { key: 'cancelled',   label: 'Avbokade' },
  ]

  const filtered = filter === 'all'
    ? bookings
    : bookings.filter((b) => b.status === filter)

  const upcoming  = bookings.filter((b) => ['pending','confirmed','in_progress'].includes(b.status))
  const completed = bookings.filter((b) => b.status === 'completed')

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-neutral-900">Mina bokningar</h1>
          <p className="text-sm text-neutral-500 mt-1">
            {upcoming.length} kommande · {completed.length} avslutade
          </p>
        </div>
        <Button size="sm" asChild>
          <Link href="/book">
            <Plus size={14} />
            Ny bokning
          </Link>
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Kommande',  value: upcoming.length,          color: 'text-brand-600' },
          { label: 'Avslutade', value: completed.length,         color: 'text-teal-600'  },
          { label: 'Totalt',    value: bookings.length,          color: 'text-neutral-800'},
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white border border-neutral-200 rounded-xl p-4 text-center">
            <p className={`font-display text-3xl ${color}`}>{value}</p>
            <p className="text-xs text-neutral-500 mt-1">{label}</p>
          </div>
        ))}
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

      {/* Bookings list */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={24} className="animate-spin text-neutral-400" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="Inga bokningar hittades"
          description="Du har inga bokningar i den här kategorin ännu."
          action={{ label: 'Boka städning', href: '/book' }}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((booking) => {
            const status     = BOOKING_STATUS_LABELS[booking.status]
            const date       = new Date(booking.scheduledAt)
            const isUpcoming = ['pending','confirmed','in_progress'].includes(booking.status)
            const canCancel  = isUpcoming && booking.status !== 'in_progress'

            return (
              <div
                key={booking.id}
                className="bg-white border border-neutral-200 rounded-xl p-5 hover:shadow-card transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Status + service */}
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <Badge className={status?.color ?? ''}>
                        {status?.label ?? booking.status}
                      </Badge>
                      <span className="text-sm font-medium text-neutral-900">
                        {booking.items?.[0]?.service?.nameSv ?? 'Städning'}
                      </span>
                    </div>

                    {/* Details */}
                    <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                      <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                        <CalendarDays size={12} />
                        <span className="capitalize">
                          {format(date, "EEE d MMM yyyy", { locale: sv })}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                        <Clock size={12} />
                        <span>
                          {format(date, 'HH:mm')} · {booking.durationMinutes / 60} tim
                        </span>
                      </div>
                      {booking.property && (
                        <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                          <MapPin size={12} />
                          <span>{booking.property.addressLine1}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Price + actions */}
                  <div className="text-right shrink-0">
                    <p className="font-display text-lg text-brand-700">
                      {formatSEK(Number(booking.customerPays))}
                    </p>
                    {Number(booking.rutDeduction) > 0 && (
                      <p className="text-xs text-teal-600">
                        inkl. RUT −{formatSEK(Number(booking.rutDeduction))}
                      </p>
                    )}
                  </div>
                </div>

                {/* Action row */}
                {(canCancel || booking.status === 'completed') && (
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-neutral-100">
                    {canCancel && (
                      <button
                        onClick={() => setCancelTarget(booking)}
                        className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-600 transition-colors"
                      >
                        <X size={12} />
                        Avboka
                      </button>
                    )}
                    {booking.status === 'completed' && (
                      <Button size="sm" variant="outline" asChild className="ml-auto">
                        <Link href="/book">
                          <RefreshCw size={12} />
                          Boka igen
                        </Link>
                      </Button>
                    )}
                    <Link href={`/dashboard/bookings/${booking.id}`} className="ml-auto flex items-center gap-1 text-xs text-brand-600 hover:underline">
                      Detaljer <ChevronRight size={12} />
                    </Link>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Cancel modal */}
      {cancelTarget && (
        <CancelModal
          booking={cancelTarget}
          onConfirm={(reason) => handleCancel(cancelTarget.id, reason)}
          onClose={() => setCancelTarget(null)}
        />
      )}
    </div>
  )
}
