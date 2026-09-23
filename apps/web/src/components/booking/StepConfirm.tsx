'use client'

import Link from 'next/link'
import { ArrowLeft, MapPin, CalendarDays, Clock, Tag, Shield, ArrowRight } from 'lucide-react'
import { format } from 'date-fns'
import { enGB } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { formatSEK } from '@/lib/utils'
import type { BookingData } from '@/app/book/page'

interface Props {
  data:       BookingData
  onSubmit:   () => void
  onBack:     () => void
  submitting: boolean
  isLoggedIn: boolean
}

export function StepConfirm({ data, onSubmit, onBack, submitting, isLoggedIn }: Props) {
  const scheduledDate = new Date(data.scheduledAt)
  const endDate        = new Date(scheduledDate.getTime() + data.durationMinutes * 60000)

  return (
    <div className="space-y-6">
      <h2 className="font-sans font-medium text-neutral-900">
        Review your booking
      </h2>

      {/* Booking summary card */}
      <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
        {/* Header */}
        <div className="bg-brand-600 px-5 py-4">
          <p className="text-xs text-brand-200 mb-0.5">Your booking</p>
          <p className="font-display text-xl text-white">{data.serviceName}</p>
        </div>

        {/* Details */}
        <div className="p-5 space-y-4">
          <div className="flex items-start gap-3">
            <CalendarDays size={17} className="text-neutral-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-neutral-400 mb-0.5">Date & time</p>
              <p className="text-sm font-medium text-neutral-900 capitalize">
                {format(scheduledDate, "EEEE d MMMM yyyy", { locale: enGB })}
              </p>
              <p className="text-sm font-medium text-neutral-900">
                {format(scheduledDate, 'HH:mm')}–{format(endDate, 'HH:mm')}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Clock size={17} className="text-neutral-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-neutral-400 mb-0.5">Duration</p>
              <p className="text-sm font-medium text-neutral-900">
                {data.durationMinutes / 60} hours
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <MapPin size={17} className="text-neutral-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-neutral-400 mb-0.5">Address</p>
              <p className="text-sm font-medium text-neutral-900">
                {data.addressLine1}
              </p>
              <p className="text-xs text-neutral-500">
                {data.postalCode} {data.city}
              </p>
            </div>
          </div>

          {data.notes && (
            <div className="flex items-start gap-3">
              <Tag size={17} className="text-neutral-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-neutral-400 mb-0.5">Notes</p>
                <p className="text-sm text-neutral-700">{data.notes}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Price breakdown */}
      <div className="bg-white border border-neutral-200 rounded-xl p-5">
        <h3 className="text-sm font-medium text-neutral-900 mb-4">Price summary</h3>
        <div className="space-y-2.5">
          <div className="flex justify-between text-sm">
            <span className="text-neutral-500">
              Labour cost ({data.servicePriceSEK} kr/hr × {data.durationMinutes / 60} hrs)
            </span>
            <span>{formatSEK(data.totalExclVat)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-neutral-500">VAT (25%)</span>
            <span>{formatSEK(data.vatAmount)}</span>
          </div>
          {data.rutDeduction > 0 && (
            <div className="flex justify-between text-sm text-teal-600">
              <span className="font-medium">RUT deduction (−50% of incl. VAT)</span>
              <span className="font-medium">−{formatSEK(data.rutDeduction)}</span>
            </div>
          )}
          <div className="border-t border-neutral-200 pt-3 mt-1 flex justify-between items-center">
            <span className="font-medium text-neutral-900">Total to pay</span>
            <span className="font-display text-2xl text-brand-700">
              {formatSEK(data.customerPays)}
            </span>
          </div>
        </div>
        {data.rutDeduction > 0 && (
          <p className="text-xs text-teal-600 mt-2 bg-teal-50 px-3 py-1.5 rounded-lg">
            You save {formatSEK(data.rutDeduction)} thanks to the RUT deduction.
            Skatteverket pays the rest directly to us.
          </p>
        )}
      </div>

      {/* Trust signals */}
      <div className="flex items-center gap-2 text-xs text-neutral-500 justify-center">
        <Shield size={14} className="text-teal-500" />
        <span>Cancel for free up to 24 hours in advance · Insured</span>
      </div>

      {/* Not logged in warning */}
      {!isLoggedIn && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-sm font-medium text-amber-800 mb-1">
            You must log in to complete the booking
          </p>
          <p className="text-xs text-amber-600 mb-3">
            Create a free account or log in to book.
          </p>
          <div className="flex gap-2">
            <Button size="sm" asChild>
              <Link href="/login?callbackUrl=/book">Log in</Link>
            </Button>
            <Button size="sm" variant="outline" asChild>
              <Link href="/register?callbackUrl=/book">Create account</Link>
            </Button>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="gap-2" disabled={submitting}>
          <ArrowLeft size={16} />
          Back
        </Button>
        <Button
          className="flex-1 group"
          size="lg"
          onClick={onSubmit}
          loading={submitting}
          disabled={!isLoggedIn || submitting}
        >
          {submitting ? 'Booking...' : `Confirm — ${formatSEK(data.customerPays)}`}
          {!submitting && (
            <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
          )}
        </Button>
      </div>
    </div>
  )
}
