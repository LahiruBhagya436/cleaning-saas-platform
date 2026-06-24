'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatSEK } from '@/lib/utils'

const HOURLY_RATE = 700
const VAT_RATE    = 0.25
const RUT_RATE    = 0.50

export function RutCalculator() {
  const [hours, setHours] = useState(2)

  const labour      = HOURLY_RATE * hours
  const vat         = labour * VAT_RATE
  const totalInclVat= labour + vat
  const rutDeduction= totalInclVat * RUT_RATE
  const customerPays= totalInclVat - rutDeduction

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 shadow-modal p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-sans font-medium text-neutral-900">Räkna ut ditt pris</h3>
        <span className="text-xs text-teal-600 bg-teal-50 px-2.5 py-1 rounded-full font-medium">
          Med RUT-avdrag
        </span>
      </div>

      {/* Hours slider */}
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-2">
          <label className="text-neutral-600 font-medium">Antal timmar</label>
          <span className="font-medium text-neutral-900">{hours} tim</span>
        </div>
        <input
          type="range"
          min={1}
          max={8}
          step={0.5}
          value={hours}
          onChange={(e) => setHours(Number(e.target.value))}
          className="w-full h-2 bg-neutral-200 rounded-full appearance-none cursor-pointer accent-brand-600"
        />
        <div className="flex justify-between text-xs text-neutral-400 mt-1.5">
          <span>1 tim</span>
          <span>8 tim</span>
        </div>
      </div>

      {/* Price breakdown */}
      <div className="space-y-2.5 mb-6">
        <div className="flex justify-between text-sm">
          <span className="text-neutral-500">Arbetskostnad ({HOURLY_RATE} kr/tim × {hours} tim)</span>
          <span className="text-neutral-700">{formatSEK(labour)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-neutral-500">Moms (25%)</span>
          <span className="text-neutral-700">{formatSEK(vat)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-neutral-500">Totalt</span>
          <span className="text-neutral-700">{formatSEK(totalInclVat)}</span>
        </div>
        <div className="border-t border-dashed border-teal-200 pt-2.5">
          <div className="flex justify-between text-sm">
            <span className="text-teal-600 font-medium">RUT-avdrag (−50%)</span>
            <span className="text-teal-600 font-medium">−{formatSEK(rutDeduction)}</span>
          </div>
        </div>
      </div>

      {/* Total */}
      <div className="bg-brand-50 rounded-xl p-4 mb-5 flex items-center justify-between">
        <div>
          <p className="text-xs text-neutral-500 mb-0.5">Du betalar</p>
          <p className="font-display text-3xl text-brand-700">{formatSEK(customerPays)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-neutral-500 mb-0.5">Du sparar</p>
          <p className="text-lg font-medium text-teal-600">{formatSEK(rutDeduction)}</p>
        </div>
      </div>

      <Button asChild className="w-full group" size="lg">
        <Link href="/book">
          Boka nu
          <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </Button>

      <p className="text-xs text-center text-neutral-400 mt-3">
        Ingen bindningstid · Avboka gratis 24h i förväg
      </p>
    </div>
  )
}
