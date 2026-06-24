'use client'

import Link from 'next/link'
import { CalendarDays, FileText, Plus, ArrowRight, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSession } from 'next-auth/react'

export default function DashboardPage() {
  const { data: session } = useSession()
  const firstName = session?.user?.name?.split(' ')[0] ?? 'kund'

  return (
    <div className="space-y-8">

      {/* Welcome */}
      <div>
        <h1 className="font-display text-2xl text-neutral-900 mb-1">
          Hej, {firstName}!
        </h1>
        <p className="text-neutral-500 text-sm">
          Hantera dina bokningar och fakturor här.
        </p>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          href="/book"
          className="flex items-center gap-4 p-5 rounded-xl border bg-brand-600 border-brand-600 text-white transition-all hover:shadow-card-hover hover:-translate-y-0.5"
        >
          <div className="w-10 h-10 rounded-lg bg-brand-500 flex items-center justify-center">
            <CalendarDays size={18} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-medium text-white">Boka städning</p>
            <p className="text-xs text-brand-200">Ny bokning på 60 sek</p>
          </div>
        </Link>

        <Link
          href="/dashboard/invoices"
          className="flex items-center gap-4 p-5 rounded-xl border bg-white border-neutral-200 transition-all hover:shadow-card-hover hover:-translate-y-0.5"
        >
          <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center">
            <FileText size={18} className="text-neutral-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-neutral-900">Mina fakturor</p>
            <p className="text-xs text-neutral-400">Ladda ner PDF</p>
          </div>
        </Link>

        <Link
          href="/dashboard/bookings"
          className="flex items-center gap-4 p-5 rounded-xl border bg-white border-neutral-200 transition-all hover:shadow-card-hover hover:-translate-y-0.5"
        >
          <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center">
            <Star size={18} className="text-neutral-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-neutral-900">Mina bokningar</p>
            <p className="text-xs text-neutral-400">Se alla bokningar</p>
          </div>
        </Link>
      </div>

      {/* Upcoming bookings */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-sans font-medium text-neutral-900">
            Kommande bokningar
          </h2>
          <Link
            href="/dashboard/bookings"
            className="text-xs text-brand-600 hover:underline flex items-center gap-1"
          >
            Se alla <ArrowRight size={12} />
          </Link>
        </div>

        <div className="bg-white rounded-xl border border-dashed border-neutral-200 p-10 text-center">
          <CalendarDays size={32} className="text-neutral-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-neutral-700 mb-1">
            Inga kommande bokningar
          </p>
          <p className="text-xs text-neutral-400 mb-5">
            Boka din första städning idag och ta del av RUT-avdraget.
          </p>
          <Button size="sm" asChild>
            <Link href="/book">
              <Plus size={14} />
              Boka nu
            </Link>
          </Button>
        </div>
      </div>

      {/* RUT tip */}
      <div className="bg-teal-50 border border-teal-200 rounded-xl p-5 flex items-start gap-4">
        <div className="w-9 h-9 rounded-lg bg-teal-100 flex items-center justify-center shrink-0 text-lg">
          💡
        </div>
        <div>
          <p className="text-sm font-medium text-teal-800 mb-1">
            Spara 50% med RUT-avdrag
          </p>
          <p className="text-xs text-teal-600 leading-relaxed">
            Alla hushållstjänster är berättigade till RUT-avdrag — du betalar
            bara hälften av arbetskostnaden. Vi hanterar ansökan till
            Skatteverket automatiskt.
          </p>
        </div>
      </div>
    </div>
  )
}
