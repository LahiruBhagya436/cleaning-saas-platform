'use client'

import { useState } from 'react'
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { format, startOfDay, isBefore, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from 'date-fns'
import { sv } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { bookingsApi } from '@/lib/api'
import { cn } from '@/lib/utils'
import type { BookingData } from '@/app/book/page'

interface Slot { startTime: string; endTime: string; available: boolean; staffCount: number }

interface Props {
  data:   BookingData
  update: (p: Partial<BookingData>) => void
  onNext: () => void
  onBack: () => void
}

export function StepDateTime({ data, update, onNext, onBack }: Props) {
  const today = startOfDay(new Date())

  const [month,      setMonth]      = useState(new Date())
  const [selectedDay,setSelectedDay]= useState<Date | null>(null)
  const [slots,      setSlots]      = useState<Slot[]>([])
  const [loadingSlots, setLoading]  = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)

  // Build calendar days
  const firstDay = startOfMonth(month)
  const lastDay  = endOfMonth(month)
  const days     = eachDayOfInterval({ start: firstDay, end: lastDay })
  // Padding for first week
  const startPad = getDay(firstDay) === 0 ? 6 : getDay(firstDay) - 1

  const selectDay = async (day: Date) => {
    setSelectedDay(day)
    setSelectedSlot(null)
    setSlots([])
    setLoading(true)
    try {
      const res = await bookingsApi.availability({
        date:            format(day, 'yyyy-MM-dd'),
        durationMinutes: data.durationMinutes,
      })
      setSlots(res.data ?? [])
    } catch (err) {
      console.error('Failed to load availability:', err)
      setSlots([])
    } finally {
      setLoading(false)
    }
  }

  const selectSlot = (slot: Slot) => {
    setSelectedSlot(slot.startTime)
    update({ scheduledAt: slot.startTime })
  }

  const canContinue = !!data.scheduledAt

  return (
    <div className="space-y-6">
      <h2 className="font-sans font-medium text-neutral-900">Välj datum & tid</h2>

      {/* Calendar */}
      <div className="bg-white border border-neutral-200 rounded-xl p-5">

        {/* Month navigation */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setMonth(subMonths(month, 1))}
            disabled={isBefore(endOfMonth(subMonths(month, 1)), today)}
            className="p-2 rounded-lg hover:bg-neutral-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <h3 className="font-medium text-neutral-900 capitalize">
            {format(month, 'MMMM yyyy', { locale: sv })}
          </h3>
          <button
            onClick={() => setMonth(addMonths(month, 1))}
            className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 mb-2">
          {['Mån','Tis','Ons','Tor','Fre','Lör','Sön'].map((d) => (
            <div key={d} className="text-center text-xs text-neutral-400 font-medium py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Day grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Start padding */}
          {[...Array(startPad)].map((_, i) => <div key={`pad-${i}`} />)}

          {days.map((day) => {
            const isPast      = isBefore(day, today)
            const isSelected  = selectedDay ? format(day, 'yyyy-MM-dd') === format(selectedDay, 'yyyy-MM-dd') : false
            const isToday     = format(day, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')
            const isWeekend   = getDay(day) === 0 || getDay(day) === 6

            return (
              <button
                key={day.toISOString()}
                onClick={() => !isPast && selectDay(day)}
                disabled={isPast}
                className={cn(
                  'aspect-square flex items-center justify-center rounded-lg text-sm transition-all',
                  isPast    && 'text-neutral-300 cursor-not-allowed',
                  isWeekend && !isPast && !isSelected && 'text-neutral-400',
                  !isPast && !isSelected && 'hover:bg-brand-50 hover:text-brand-700',
                  isToday && !isSelected && 'font-semibold text-brand-600',
                  isSelected && 'bg-brand-600 text-white font-medium shadow-sm',
                )}
              >
                {format(day, 'd')}
              </button>
            )
          })}
        </div>
      </div>

      {/* Time slots */}
      {selectedDay && (
        <div>
          <h3 className="text-sm font-medium text-neutral-900 mb-3">
            Lediga tider —{' '}
            <span className="text-brand-600 capitalize">
              {format(selectedDay, 'EEEE d MMMM', { locale: sv })}
            </span>
          </h3>

          {loadingSlots ? (
            <div className="grid grid-cols-3 gap-2">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="h-12 bg-neutral-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : slots.filter(s => s.available).length === 0 ? (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
              <p className="text-sm text-amber-700 font-medium mb-1">
                Inga lediga tider denna dag
              </p>
              <p className="text-xs text-amber-600">
                Välj ett annat datum — vi har tillgängliga städare de flesta vardagar.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {slots
                .filter((s) => s.available)
                .map((slot) => {
                  const startTime = format(new Date(slot.startTime), 'HH:mm')
                  const endTime   = format(new Date(slot.endTime), 'HH:mm')
                  const isActive  = selectedSlot === slot.startTime
                  return (
                    <button
                      key={slot.startTime}
                      onClick={() => selectSlot(slot)}
                      className={cn(
                        'py-3 rounded-xl border text-sm font-medium transition-all flex flex-col items-center gap-0.5',
                        isActive
                          ? 'border-brand-500 bg-brand-600 text-white shadow-sm'
                          : 'border-neutral-200 bg-white text-neutral-700 hover:border-brand-300 hover:bg-brand-50'
                      )}
                    >
                      <span>{startTime}–{endTime}</span>
                      <span className={cn('text-[10px]', isActive ? 'text-brand-100' : 'text-neutral-400')}>
                        Start–slut
                      </span>
                    </button>
                  )
                })}
            </div>
          )}
        </div>
      )}

      {/* Selected summary */}
      {canContinue && (
        <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 flex items-center gap-3">
          <span className="text-2xl">✅</span>
          <div>
            <p className="text-sm font-medium text-teal-800">
              {format(new Date(data.scheduledAt), "EEEE d MMMM", { locale: sv })}
              {' · '}
              {format(new Date(data.scheduledAt), 'HH:mm')}
              {'–'}
              {format(new Date(new Date(data.scheduledAt).getTime() + data.durationMinutes * 60000), 'HH:mm')}
            </p>
            <p className="text-xs text-teal-600">
              {data.durationMinutes / 60} timmar · {data.serviceName}
            </p>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="gap-2">
          <ArrowLeft size={16} />
          Tillbaka
        </Button>
        <Button
          className="flex-1 group"
          size="lg"
          disabled={!canContinue}
          onClick={onNext}
        >
          Granska & bekräfta
          <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
        </Button>
      </div>
    </div>
  )
}
