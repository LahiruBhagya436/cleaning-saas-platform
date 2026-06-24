'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { sv } from 'date-fns/locale'
import {
  ArrowLeft, CalendarDays, Clock, MapPin,
  FileText, Star, X, Loader2, CheckCircle
} from 'lucide-react'
import { toast } from 'sonner'
import { bookingsApi, invoicesApi, reviewsApi } from '@/lib/api'
import { formatSEK, BOOKING_STATUS_LABELS } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/dashboard/Badge'
import { CancelModal } from '@/components/dashboard/CancelModal'

export default function BookingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router  = useRouter()

  const [booking,      setBooking]      = useState<any>(null)
  const [loading,      setLoading]      = useState(true)
  const [cancelTarget, setCancelTarget] = useState(false)
  const [rating,       setRating]       = useState(0)
  const [comment,      setComment]      = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)
  const [reviewDone,   setReviewDone]   = useState(false)

  useEffect(() => {
    if (!id) return
    bookingsApi.get(id)
      .then((res) => setBooking(res.data))
      .catch(() => toast.error('Bokning hittades inte.'))
      .finally(() => setLoading(false))
  }, [id])

  const handleCancel = async (reason: string) => {
    try {
      await bookingsApi.cancel(id, reason)
      toast.success('Bokning avbokad.')
      setCancelTarget(false)
      router.push('/dashboard/bookings')
    } catch (err: any) {
      toast.error(err?.message ?? 'Kunde inte avboka.')
    }
  }

  const handleReview = async () => {
    if (!rating) {
      toast.error('Välj ett betyg.')
      return
    }
    setSubmittingReview(true)
    try {
      await reviewsApi.create({ bookingId: id, rating, comment })
      toast.success('Tack för ditt omdöme!')
      setReviewDone(true)
    } catch (err: any) {
      toast.error(err?.message ?? 'Kunde inte skicka omdöme.')
    } finally {
      setSubmittingReview(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-neutral-400" />
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="text-center py-20">
        <p className="text-neutral-500 mb-4">Bokningen hittades inte.</p>
        <Button asChild variant="outline">
          <Link href="/dashboard/bookings"><ArrowLeft size={14} /> Tillbaka</Link>
        </Button>
      </div>
    )
  }

  const status     = BOOKING_STATUS_LABELS[booking.status]
  const date       = new Date(booking.scheduledAt)
  const isUpcoming = ['pending', 'confirmed', 'in_progress'].includes(booking.status)
  const canCancel  = isUpcoming && booking.status !== 'in_progress'
  const canReview  = booking.status === 'completed' && !booking.reviews?.length && !reviewDone

  return (
    <div className="space-y-6 max-w-2xl">

      {/* Back */}
      <Link
        href="/dashboard/bookings"
        className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-800 transition-colors"
      >
        <ArrowLeft size={14} />
        Tillbaka till bokningar
      </Link>

      {/* Header card */}
      <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden">
        <div className="bg-brand-600 px-6 py-5">
          <div className="flex items-center gap-2 mb-1">
            <Badge className={status?.color ?? ''}>
              {status?.label ?? booking.status}
            </Badge>
          </div>
          <h1 className="font-display text-2xl text-white">
            {booking.items?.[0]?.service?.nameSv ?? 'Städning'}
          </h1>
          <p className="text-brand-200 text-sm mt-1">
            Boknings-ID: <span className="font-mono">{booking.id.slice(0, 8).toUpperCase()}</span>
          </p>
        </div>

        <div className="p-6 grid sm:grid-cols-2 gap-5">
          <div className="flex items-start gap-3">
            <CalendarDays size={17} className="text-neutral-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-neutral-400 mb-0.5">Datum & tid</p>
              <p className="text-sm font-medium text-neutral-900 capitalize">
                {format(date, "EEEE d MMMM yyyy", { locale: sv })}
              </p>
              <p className="text-sm text-neutral-500">
                kl. {format(date, 'HH:mm')}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Clock size={17} className="text-neutral-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-neutral-400 mb-0.5">Varaktighet</p>
              <p className="text-sm font-medium text-neutral-900">
                {booking.durationMinutes / 60} timmar
              </p>
            </div>
          </div>

          {booking.property && (
            <div className="flex items-start gap-3 sm:col-span-2">
              <MapPin size={17} className="text-neutral-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-neutral-400 mb-0.5">Adress</p>
                <p className="text-sm font-medium text-neutral-900">
                  {booking.property.addressLine1}
                </p>
                <p className="text-xs text-neutral-500">
                  {booking.property.postalCode} {booking.property.city}
                </p>
              </div>
            </div>
          )}

          {booking.notes && (
            <div className="sm:col-span-2 bg-neutral-50 rounded-lg p-3 text-sm text-neutral-600 italic">
              "{booking.notes}"
            </div>
          )}
        </div>
      </div>

      {/* Price breakdown */}
      <div className="bg-white border border-neutral-200 rounded-xl p-5">
        <h2 className="font-medium text-neutral-900 mb-4">Prissammanfattning</h2>
        <div className="space-y-2.5">
          <div className="flex justify-between text-sm">
            <span className="text-neutral-500">Arbetskostnad (exkl. moms)</span>
            <span>{formatSEK(Number(booking.totalPriceExclVat))}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-neutral-500">Moms (25%)</span>
            <span>{formatSEK(Number(booking.vatAmount))}</span>
          </div>
          {Number(booking.rutDeduction) > 0 && (
            <div className="flex justify-between text-sm text-teal-600">
              <span>RUT-avdrag</span>
              <span>−{formatSEK(Number(booking.rutDeduction))}</span>
            </div>
          )}
          <div className="flex justify-between font-medium text-neutral-900 border-t border-neutral-200 pt-3 mt-1">
            <span>Du betalar</span>
            <span className="font-display text-xl text-brand-700">
              {formatSEK(Number(booking.customerPays))}
            </span>
          </div>
        </div>
      </div>

      {/* Invoice link */}
      {booking.invoice && (
        <div className="bg-white border border-neutral-200 rounded-xl p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-neutral-100 flex items-center justify-center">
              <FileText size={16} className="text-neutral-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-900">Faktura</p>
              <p className="text-xs text-neutral-400 font-mono">{booking.invoice.invoiceNumber}</p>
            </div>
          </div>
          <Button size="sm" variant="outline" asChild>
            <Link href="/dashboard/invoices">Visa faktura</Link>
          </Button>
        </div>
      )}

      {/* Review form */}
      {canReview && (
        <div className="bg-white border border-neutral-200 rounded-xl p-5">
          <h2 className="font-medium text-neutral-900 mb-1">Lämna ett omdöme</h2>
          <p className="text-sm text-neutral-500 mb-4">
            Hur nöjd är du med städningen?
          </p>

          {/* Star rating */}
          <div className="flex gap-2 mb-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                className="focus:outline-none"
              >
                <Star
                  size={28}
                  className={`transition-colors ${
                    star <= rating
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-neutral-200 hover:text-amber-300'
                  }`}
                />
              </button>
            ))}
          </div>

          <textarea
            placeholder="Berätta gärna om din upplevelse... (valfritt)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 resize-none mb-4"
          />

          <Button onClick={handleReview} loading={submittingReview} disabled={!rating}>
            <Star size={14} />
            Skicka omdöme
          </Button>
        </div>
      )}

      {reviewDone && (
        <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle size={18} className="text-teal-600 shrink-0" />
          <p className="text-sm text-teal-700 font-medium">Tack! Ditt omdöme har skickats.</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        {canCancel && (
          <Button
            variant="outline"
            onClick={() => setCancelTarget(true)}
            className="text-red-500 border-red-200 hover:bg-red-50"
          >
            <X size={14} />
            Avboka
          </Button>
        )}
        <Button asChild variant="outline">
          <Link href="/book">Boka igen</Link>
        </Button>
      </div>

      {/* Cancel modal */}
      {cancelTarget && (
        <CancelModal
          booking={booking}
          onConfirm={handleCancel}
          onClose={() => setCancelTarget(false)}
        />
      )}
    </div>
  )
}
