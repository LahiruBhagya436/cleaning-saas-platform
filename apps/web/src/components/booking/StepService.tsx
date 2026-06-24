'use client'

import { useEffect, useState } from 'react'
import { ArrowRight, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { servicesApi } from '@/lib/api'
import { formatSEK } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { BookingData } from '@/app/book/page'

const DURATION_OPTIONS = [
  { label: '1 timme',     value: 60  },
  { label: '1.5 timmar',  value: 90  },
  { label: '2 timmar',    value: 120 },
  { label: '3 timmar',    value: 180 },
  { label: '4 timmar',    value: 240 },
  { label: '6 timmar',    value: 360 },
]

const SERVICE_ICONS: Record<string, string> = {
  'Regular home cleaning':    '🏠',
  'Deep cleaning':            '✨',
  'Move-in / move-out cleaning': '📦',
  'Window cleaning':          '🪟',
  'After-party cleaning':     '🎉',
  'Office cleaning':          '🏢',
  'Stairwell cleaning':       '🪜',
  'Post-construction cleaning':'🔨',
}

interface Props {
  data:   BookingData
  update: (p: Partial<BookingData>) => void
  onNext: () => void
}

export function StepService({ data, update, onNext }: Props) {
  const [services, setServices] = useState<any[]>([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    servicesApi.list()
      .then((res) => setServices(res.data))
      .catch(() => setServices([]))
      .finally(() => setLoading(false))
  }, [])

  const selected = services.find((s) => s.id === data.serviceId)

  // Recalculate price when service or duration changes
  const recalculate = (service: any, durationMinutes: number) => {
    if (!service) return
    const hours         = durationMinutes / 60
    const totalExclVat  = +(Number(service.basePricePerHour) * hours).toFixed(2)
    const vatAmount     = +(totalExclVat * 0.25).toFixed(2)
    const totalInclVat  = totalExclVat + vatAmount
    const rutDeduction  = service.rutEligible ? +(totalInclVat * 0.5).toFixed(2) : 0
    const customerPays  = +(totalInclVat - rutDeduction).toFixed(2)
    update({ totalExclVat, vatAmount, rutDeduction, customerPays })
  }

  const selectService = (svc: any) => {
    update({
      serviceId:       svc.id,
      serviceName:     svc.nameSv,
      servicePriceSEK: Number(svc.basePricePerHour),
      rutEligible:     svc.rutEligible,
    })
    recalculate(svc, data.durationMinutes)
  }

  const selectDuration = (mins: number) => {
    update({ durationMinutes: mins })
    if (selected) recalculate(selected, mins)
  }

  const canContinue = !!data.serviceId

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-20 bg-neutral-100 rounded-xl animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Service list */}
      <div>
        <h2 className="font-sans font-medium text-neutral-900 mb-4">
          Välj tjänst
        </h2>
        <div className="space-y-3">
          {services.map((svc) => {
            const isSelected = data.serviceId === svc.id
            const hours      = data.durationMinutes / 60
            const total      = Number(svc.basePricePerHour) * hours * 1.25
            const afterRut   = svc.rutEligible ? total * 0.5 : total

            return (
              <button
                key={svc.id}
                onClick={() => selectService(svc)}
                className={cn(
                  'w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all',
                  isSelected
                    ? 'border-brand-400 bg-brand-50 ring-2 ring-brand-100'
                    : 'border-neutral-200 bg-white hover:border-neutral-300 hover:shadow-card'
                )}
              >
                {/* Icon */}
                <span className="text-2xl w-10 text-center shrink-0">
                  {SERVICE_ICONS[svc.name] ?? '🧹'}
                </span>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-medium text-neutral-900">
                      {svc.nameSv}
                    </span>
                    {svc.rutEligible && (
                      <span className="text-2xs font-medium text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded-full">
                        RUT
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-neutral-400">{svc.name}</span>
                </div>

                {/* Price */}
                <div className="text-right shrink-0">
                  {svc.rutEligible ? (
                    <>
                      <p className="text-xs text-neutral-400 line-through">
                        {formatSEK(total)}/tim
                      </p>
                      <p className="text-sm font-medium text-teal-600">
                        {formatSEK(afterRut)}/tim
                      </p>
                      <p className="text-2xs text-neutral-400">med RUT</p>
                    </>
                  ) : (
                    <p className="text-sm font-medium text-neutral-800">
                      {formatSEK(total)}/tim
                    </p>
                  )}
                </div>

                {/* Check mark */}
                <div className={cn(
                  'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all',
                  isSelected
                    ? 'border-brand-600 bg-brand-600'
                    : 'border-neutral-300'
                )}>
                  {isSelected && <Check size={11} className="text-white" strokeWidth={3} />}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Duration */}
      {data.serviceId && (
        <div>
          <h2 className="font-sans font-medium text-neutral-900 mb-3">
            Hur länge?
          </h2>
          <div className="grid grid-cols-3 gap-2">
            {DURATION_OPTIONS.map(({ label, value }) => {
              // Hide durations shorter than service minimum
              if (selected && value < (selected.minDurationMins ?? 60)) return null
              return (
                <button
                  key={value}
                  onClick={() => selectDuration(value)}
                  className={cn(
                    'py-2.5 rounded-lg border text-sm font-medium transition-all',
                    data.durationMinutes === value
                      ? 'border-brand-400 bg-brand-50 text-brand-700'
                      : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300'
                  )}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Price summary */}
      {canContinue && (
        <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4">
          <div className="flex justify-between text-sm mb-1.5">
            <span className="text-neutral-500">Arbetskostnad</span>
            <span>{formatSEK(data.totalExclVat)}</span>
          </div>
          <div className="flex justify-between text-sm mb-1.5">
            <span className="text-neutral-500">Moms (25%)</span>
            <span>{formatSEK(data.vatAmount)}</span>
          </div>
          {data.rutDeduction > 0 && (
            <div className="flex justify-between text-sm text-teal-600 mb-1.5">
              <span>RUT-avdrag (−50%)</span>
              <span>−{formatSEK(data.rutDeduction)}</span>
            </div>
          )}
          <div className="border-t border-neutral-200 mt-2 pt-2 flex justify-between font-medium">
            <span className="text-neutral-900">Du betalar</span>
            <span className="text-brand-700 font-display text-lg">
              {formatSEK(data.customerPays)}
            </span>
          </div>
        </div>
      )}

      <Button
        className="w-full group"
        size="lg"
        disabled={!canContinue}
        onClick={onNext}
      >
        Fortsätt — välj adress
        <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
      </Button>
    </div>
  )
}
