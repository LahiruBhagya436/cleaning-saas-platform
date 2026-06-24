'use client'

import Link from 'next/link'
import { ArrowLeft, MapPin, CalendarDays, Clock, Tag, Shield, ArrowRight } from 'lucide-react'
import { format } from 'date-fns'
import { sv } from 'date-fns/locale'
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
        Granska din bokning
      </h2>

      {/* Booking summary card */}
      <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
        {/* Header */}
        <div className="bg-brand-600 px-5 py-4">
          <p className="text-xs text-brand-200 mb-0.5">Din bokning</p>
          <p className="font-display text-xl text-white">{data.serviceName}</p>
        </div>

        {/* Details */}
        <div className="p-5 space-y-4">
          <div className="flex items-start gap-3">
            <CalendarDays size={17} className="text-neutral-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-neutral-400 mb-0.5">Datum & tid</p>
              <p className="text-sm font-medium text-neutral-900 capitalize">
                {format(scheduledDate, "EEEE d MMMM yyyy", { locale: sv })}
              </p>
              <p className="text-sm font-medium text-neutral-900">
                {format(scheduledDate, 'HH:mm')}–{format(endDate, 'HH:mm')}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Clock size={17} className="text-neutral-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-neutral-400 mb-0.5">Varaktighet</p>
              <p className="text-sm font-medium text-neutral-900">
                {data.durationMinutes / 60} timmar
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <MapPin size={17} className="text-neutral-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-neutral-400 mb-0.5">Adress</p>
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
                <p className="text-xs text-neutral-400 mb-0.5">Anteckningar</p>
                <p className="text-sm text-neutral-700">{data.notes}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Price breakdown */}
      <div className="bg-white border border-neutral-200 rounded-xl p-5">
        <h3 className="text-sm font-medium text-neutral-900 mb-4">Prissammanfattning</h3>
        <div className="space-y-2.5">
          <div className="flex justify-between text-sm">
            <span className="text-neutral-500">
              Arbetskostnad ({data.servicePriceSEK} kr/tim × {data.durationMinutes / 60} tim)
            </span>
            <span>{formatSEK(data.totalExclVat)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-neutral-500">Moms (25%)</span>
            <span>{formatSEK(data.vatAmount)}</span>
          </div>
          {data.rutDeduction > 0 && (
            <div className="flex justify-between text-sm text-teal-600">
              <span className="font-medium">RUT-avdrag (−50% av inkl. moms)</span>
              <span className="font-medium">−{formatSEK(data.rutDeduction)}</span>
            </div>
          )}
          <div className="border-t border-neutral-200 pt-3 mt-1 flex justify-between items-center">
            <span className="font-medium text-neutral-900">Totalt att betala</span>
            <span className="font-display text-2xl text-brand-700">
              {formatSEK(data.customerPays)}
            </span>
          </div>
        </div>
        {data.rutDeduction > 0 && (
          <p className="text-xs text-teal-600 mt-2 bg-teal-50 px-3 py-1.5 rounded-lg">
            Du sparar {formatSEK(data.rutDeduction)} tack vare RUT-avdrag.
            Skatteverket betalar resten direkt till oss.
          </p>
        )}
      </div>

      {/* Trust signals */}
      <div className="flex items-center gap-2 text-xs text-neutral-500 justify-center">
        <Shield size={14} className="text-teal-500" />
        <span>Avboka gratis upp till 24 timmar i förväg · Ansvarsförsäkrat</span>
      </div>

      {/* Not logged in warning */}
      {!isLoggedIn && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-sm font-medium text-amber-800 mb-1">
            Du måste logga in för att slutföra bokningen
          </p>
          <p className="text-xs text-amber-600 mb-3">
            Skapa ett gratis konto eller logga in för att boka.
          </p>
          <div className="flex gap-2">
            <Button size="sm" asChild>
              <Link href="/login?callbackUrl=/book">Logga in</Link>
            </Button>
            <Button size="sm" variant="outline" asChild>
              <Link href="/register?callbackUrl=/book">Skapa konto</Link>
            </Button>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="gap-2" disabled={submitting}>
          <ArrowLeft size={16} />
          Tillbaka
        </Button>
        <Button
          className="flex-1 group"
          size="lg"
          onClick={onSubmit}
          loading={submitting}
          disabled={!isLoggedIn || submitting}
        >
          {submitting ? 'Bokar...' : `Bekräfta — ${formatSEK(data.customerPays)}`}
          {!submitting && (
            <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
          )}
        </Button>
      </div>
    </div>
  )
}
