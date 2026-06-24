'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { sv } from 'date-fns/locale'
import { X, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/index'

interface Props {
  booking:   any
  onConfirm: (reason: string) => void
  onClose:   () => void
}

const CANCEL_REASONS = [
  'Planer ändrades',
  'Hittat annan leverantör',
  'Ekonomiska skäl',
  'Felinmatning vid bokning',
  'Annat',
]

export function CancelModal({ booking, onConfirm, onClose }: Props) {
  const [reason,     setReason]     = useState('')
  const [confirming, setConfirming] = useState(false)

  const scheduledDate = new Date(booking.scheduledAt)
  const hoursUntil    = (scheduledDate.getTime() - Date.now()) / 3_600_000
  const tooLate       = hoursUntil < 24

  const handleConfirm = async () => {
    if (!reason) return
    setConfirming(true)
    await onConfirm(reason)
    setConfirming(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-modal w-full max-w-md p-6 animate-scale-in">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors"
        >
          <X size={16} />
        </button>

        {/* Icon */}
        <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center mb-4">
          <AlertTriangle size={22} className="text-red-500" />
        </div>

        <h2 className="font-display text-xl text-neutral-900 mb-1">
          Avboka städning?
        </h2>
        <p className="text-sm text-neutral-500 mb-5">
          {format(scheduledDate, "EEEE d MMMM 'kl.' HH:mm", { locale: sv })}
        </p>

        {/* Too late warning */}
        {tooLate && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-5">
            <p className="text-xs font-medium text-amber-800">
              ⚠️ Avbokning inom 24 timmar
            </p>
            <p className="text-xs text-amber-600 mt-1">
              Avbokning inom 24 timmar kan medföra en avbokningsavgift.
            </p>
          </div>
        )}

        {/* Reason */}
        <div className="mb-5">
          <Label className="mb-2">Anledning till avbokning</Label>
          <div className="space-y-2">
            {CANCEL_REASONS.map((r) => (
              <button
                key={r}
                onClick={() => setReason(r)}
                className={`w-full text-left px-3 py-2.5 rounded-lg border text-sm transition-all ${
                  reason === r
                    ? 'border-brand-400 bg-brand-50 text-brand-700'
                    : 'border-neutral-200 text-neutral-700 hover:border-neutral-300'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Behåll bokning
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            loading={confirming}
            disabled={!reason || confirming}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
          >
            Avboka
          </Button>
        </div>
      </div>
    </div>
  )
}
