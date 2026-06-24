'use client'

import Link from 'next/link'
import { format } from 'date-fns'
import { sv } from 'date-fns/locale'
import { CheckCircle, CalendarDays, ArrowRight, Home } from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { Button } from '@/components/ui/button'
import { formatSEK } from '@/lib/utils'

interface Props { booking: any }

export function BookingSuccess({ booking }: Props) {
  const scheduledDate = new Date(booking.scheduledAt)

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navbar />
      <div className="container-tight py-16 text-center max-w-md mx-auto">

        {/* Success icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-teal-50 border-2 border-teal-200 flex items-center justify-center">
            <CheckCircle size={40} className="text-teal-500" />
          </div>
        </div>

        <h1 className="font-display text-3xl text-neutral-900 mb-3">
          Bokning bekräftad!
        </h1>
        <p className="text-neutral-500 mb-8 leading-relaxed">
          Vi har skickat en bekräftelse till din e-post.
          En av våra städare tar hand om ditt hem den{' '}
          <span className="font-medium text-neutral-800 capitalize">
            {format(scheduledDate, "d MMMM 'kl.' HH:mm", { locale: sv })}
          </span>.
        </p>

        {/* Booking details card */}
        <div className="bg-white border border-neutral-200 rounded-xl p-5 mb-6 text-left space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-neutral-500">Bokningsnummer</span>
            <span className="font-mono text-neutral-800">{booking.id.slice(0, 8).toUpperCase()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-neutral-500">Datum</span>
            <span className="text-neutral-800 capitalize">
              {format(scheduledDate, "EEE d MMM 'kl.' HH:mm", { locale: sv })}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-neutral-500">Status</span>
            <span className="text-teal-600 font-medium">Bekräftad</span>
          </div>
          <div className="border-t border-neutral-100 pt-3 flex justify-between">
            <span className="text-sm text-neutral-500">Du betalar</span>
            <span className="font-display text-lg text-brand-700">
              {formatSEK(Number(booking.customerPays))}
            </span>
          </div>
        </div>

        {/* What happens next */}
        <div className="bg-brand-50 border border-brand-100 rounded-xl p-5 mb-8 text-left">
          <h3 className="text-sm font-medium text-brand-900 mb-3">Vad händer nu?</h3>
          <div className="space-y-2.5">
            {[
              'Du får en bekräftelse via e-post inom några minuter',
              'Dagen innan får du en påminnelse om din bokning',
              'Städaren anländer på avtalad tid',
              'Efter städningen betygsätter du tjänsten i appen',
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-2.5 text-xs text-brand-700">
                <div className="w-4 h-4 rounded-full bg-brand-200 flex items-center justify-center shrink-0 mt-0.5 text-brand-700 font-bold text-2xs">
                  {i + 1}
                </div>
                {step}
              </div>
            ))}
          </div>
        </div>

        {/* CTAs */}
        <div className="flex flex-col gap-3">
          <Button size="lg" asChild className="group">
            <Link href="/dashboard/bookings">
              <CalendarDays size={16} />
              Se mina bokningar
              <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/">
              <Home size={16} />
              Tillbaka till startsidan
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
