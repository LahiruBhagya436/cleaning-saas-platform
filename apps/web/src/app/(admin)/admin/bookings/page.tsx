'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  isSameMonth, isSameDay, addMonths, subMonths, getDay,
} from 'date-fns'
import { sv } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Loader2, CalendarDays, X, Info } from 'lucide-react'
import { toast } from 'sonner'
import { adminApi } from '@/lib/api'
import { BOOKING_STATUS_LABELS, cn } from '@/lib/utils'

const WEEKDAYS = ['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön']

// Left-border accent + soft background per status (colourful board)
const STATUS_CHIP: Record<string, string> = {
  pending:     'bg-amber-50 border-l-amber-400 text-amber-800',
  confirmed:   'bg-teal-50 border-l-teal-400 text-teal-800',
  in_progress: 'bg-brand-50 border-l-brand-400 text-brand-800',
  completed:   'bg-neutral-100 border-l-neutral-300 text-neutral-500',
  cancelled:   'bg-red-50 border-l-red-300 text-red-700 line-through',
}

function initials(name: string) {
  return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
}

export default function AdminBookingsPage() {
  const [bookings, setBookings]   = useState<any[]>([])
  const [workers,  setWorkers]    = useState<any[]>([])
  const [loading,  setLoading]    = useState(true)
  const [month,    setMonth]      = useState(startOfMonth(new Date()))
  const [assigning, setAssigning] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null) // click-to-assign
  const [draggingId, setDraggingId] = useState<string | null>(null) // drag-and-drop
  const [dropTarget, setDropTarget] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const [bRes, wRes] = await Promise.all([
        adminApi.bookings({ limit: 100 }),
        adminApi.workers(),
      ])
      setBookings(bRes.data ?? [])
      setWorkers((wRes.data ?? []).filter((w: any) => w.isActive))
    } catch {
      toast.error('Kunde inte hämta bokningar.')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [])

  const monthBookings = useMemo(
    () => bookings.filter((b) => isSameMonth(new Date(b.scheduledAt), month)),
    [bookings, month],
  )
  const days     = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) })
  const startPad = (getDay(startOfMonth(month)) + 6) % 7 // Monday-first grid
  const today    = new Date()

  const dayBookings = (day: Date) =>
    monthBookings
      .filter((b) => isSameDay(new Date(b.scheduledAt), day))
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())

  const assign = async (bookingId: string, staffId: string | null) => {
    setAssigning(bookingId)
    try {
      const updated = await adminApi.assignBooking(bookingId, staffId)
      setBookings((prev) => prev.map((b) => (b.id === bookingId ? updated.data : b)))
      toast.success(staffId ? 'Personal tilldelad ✓' : 'Tilldelning borttagen')
      setSelectedId(null)
    } catch (err: any) {
      toast.error(err?.message ?? 'Kunde inte tilldela.')
    } finally {
      setAssigning(null)
    }
  }

  // click a booking, then a worker → assign (touch-friendly); OR drag a booking onto a worker
  const activateWorker = (workerId: string | null) => { if (selectedId) assign(selectedId, workerId) }
  const dropOnWorker   = (workerId: string | null) => {
    const id = draggingId
    setDraggingId(null); setDropTarget(null)
    if (id) assign(id, workerId)
  }

  const monthStats = useMemo(() => {
    const s: Record<string, number> = {}
    monthBookings.forEach((b) => { s[b.status] = (s[b.status] ?? 0) + 1 })
    return s
  }, [monthBookings])

  const unassignedCount = monthBookings.filter((b) => !b.staff && b.status !== 'cancelled').length

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-neutral-400" />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-2xl text-neutral-900">Bokningar</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Månadsvy · dra en bokning till en medarbetare för att tilldela.
          </p>
        </div>
        {/* Month navigation */}
        <div className="flex items-center gap-2 bg-white border border-neutral-200 rounded-xl px-2 py-1.5">
          <button onClick={() => setMonth(subMonths(month, 1))}
            className="p-1.5 rounded-lg hover:bg-neutral-100 transition-colors"><ChevronLeft size={16} /></button>
          <span className="text-sm font-semibold text-neutral-800 capitalize min-w-[130px] text-center">
            {format(month, 'MMMM yyyy', { locale: sv })}
          </span>
          <button onClick={() => setMonth(addMonths(month, 1))}
            className="p-1.5 rounded-lg hover:bg-neutral-100 transition-colors"><ChevronRight size={16} /></button>
          <button onClick={() => setMonth(startOfMonth(new Date()))}
            className="ml-1 text-xs font-medium text-brand-600 hover:bg-brand-50 rounded-lg px-2 py-1.5 transition-colors">Idag</button>
        </div>
      </div>

      {/* Legend + stats */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {Object.entries(BOOKING_STATUS_LABELS).map(([key, v]) => (
          <span key={key} className="flex items-center gap-1.5 text-xs text-neutral-500">
            <span className={cn('w-2.5 h-2.5 rounded-full', v.color.split(' ').find((c) => c.startsWith('bg-')))} />
            {v.label}{monthStats[key] ? ` (${monthStats[key]})` : ''}
          </span>
        ))}
      </div>

      {selectedId && (
        <div className="flex items-center gap-3 bg-brand-600 text-white rounded-xl px-4 py-2.5 text-sm">
          <Info size={15} />
          <span>Bokning vald — klicka på en medarbetare till höger för att tilldela.</span>
          <button onClick={() => setSelectedId(null)} className="ml-auto p-1 hover:bg-white/20 rounded-lg"><X size={14} /></button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-5 items-start">
        {/* ── Calendar ── */}
        <div className="bg-white border border-neutral-200 rounded-2xl p-4">
          <div className="grid grid-cols-7 mb-2">
            {WEEKDAYS.map((d) => (
              <div key={d} className="text-center text-xs font-medium text-neutral-400 py-1">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {[...Array(startPad)].map((_, i) => <div key={`pad-${i}`} />)}
            {days.map((day) => {
              const list = dayBookings(day)
              const isToday = isSameDay(day, today)
              return (
                <div key={day.toISOString()}
                  className={cn(
                    'min-h-[104px] rounded-xl border p-1.5 flex flex-col gap-1 transition-colors',
                    isToday ? 'border-brand-300 bg-brand-50/40' : 'border-neutral-100 bg-neutral-50/50',
                  )}>
                  <span className={cn('text-xs font-semibold px-1',
                    isToday ? 'text-brand-700' : 'text-neutral-400')}>{format(day, 'd')}</span>
                  <div className="flex flex-col gap-1 overflow-y-auto max-h-[160px]">
                    {list.map((b) => {
                      const chip = STATUS_CHIP[b.status] ?? STATUS_CHIP.pending
                      const isSel = selectedId === b.id
                      return (
                        <button
                          key={b.id}
                          draggable
                          onDragStart={(e) => { setDraggingId(b.id); e.dataTransfer.effectAllowed = 'move' }}
                          onDragEnd={() => { setDraggingId(null); setDropTarget(null) }}
                          onClick={() => setSelectedId(isSel ? null : b.id)}
                          className={cn(
                            'text-left rounded-md border-l-4 px-1.5 py-1 text-[11px] leading-tight cursor-grab active:cursor-grabbing transition-all',
                            chip,
                            isSel && 'ring-2 ring-brand-500 ring-offset-1',
                            assigning === b.id && 'opacity-50',
                          )}
                          title={`${b.customer?.fullName ?? 'Kund'} — ${format(new Date(b.scheduledAt), 'HH:mm')}`}
                        >
                          <span className="font-semibold">{format(new Date(b.scheduledAt), 'HH:mm')}</span>{' '}
                          <span className="truncate">{b.customer?.fullName ?? 'Kund'}</span>
                          <span className="flex items-center gap-1 mt-0.5">
                            {b.staff
                              ? <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-white/70 text-[8px] font-bold">{initials(b.staff.fullName)}</span>
                              : <span className="text-[9px] font-medium opacity-70">• ej tilldelad</span>}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Workers panel (drop targets) ── */}
        <aside className="space-y-2 lg:sticky lg:top-4">
          <div className="bg-white border border-neutral-200 rounded-2xl p-3">
            <p className="text-xs font-semibold text-neutral-700 mb-1 flex items-center gap-1.5">
              <CalendarDays size={13} /> Medarbetare
            </p>
            <p className="text-[11px] text-neutral-400 mb-3">Dra en bokning hit — eller välj en bokning och klicka här.</p>

            <div className="space-y-2">
              {workers.length === 0 && (
                <p className="text-xs text-neutral-400">Inga aktiva medarbetare. Lägg till under "Personal".</p>
              )}
              {workers.map((w) => {
                const jobs = monthBookings.filter((b) => b.staff?.id === w.id && b.status !== 'cancelled').length
                const active = dropTarget === w.id || (!!selectedId)
                return (
                  <div
                    key={w.id}
                    onDragOver={(e) => { e.preventDefault(); setDropTarget(w.id) }}
                    onDragLeave={() => setDropTarget((t) => (t === w.id ? null : t))}
                    onDrop={(e) => { e.preventDefault(); dropOnWorker(w.id) }}
                    onClick={() => activateWorker(w.id)}
                    className={cn(
                      'flex items-center gap-2.5 rounded-xl border p-2.5 transition-all',
                      active ? 'border-brand-400 bg-brand-50 cursor-pointer' : 'border-neutral-200 bg-white',
                      dropTarget === w.id && 'ring-2 ring-brand-500 scale-[1.02]',
                    )}
                  >
                    <span className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-xs font-bold text-brand-700 shrink-0">
                      {initials(w.fullName)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-neutral-800 truncate">{w.fullName}</p>
                      <p className="text-[11px] text-neutral-400">
                        {w.role === 'coordinator' ? 'Arbetsledare' : 'Städare'} · {jobs} jobb
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Unassign drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDropTarget('unassign') }}
            onDragLeave={() => setDropTarget((t) => (t === 'unassign' ? null : t))}
            onDrop={(e) => { e.preventDefault(); dropOnWorker(null) }}
            onClick={() => activateWorker(null)}
            className={cn(
              'rounded-xl border border-dashed p-3 text-center text-xs transition-all',
              dropTarget === 'unassign' ? 'border-red-400 bg-red-50 text-red-600 ring-2 ring-red-300'
                : selectedId ? 'border-neutral-300 text-neutral-500 cursor-pointer hover:border-red-300 hover:text-red-500'
                : 'border-neutral-200 text-neutral-400',
            )}
          >
            Ta bort tilldelning{unassignedCount ? ` · ${unassignedCount} ej tilldelade` : ''}
          </div>
        </aside>
      </div>
    </div>
  )
}
