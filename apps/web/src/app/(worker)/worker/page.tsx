'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { sv } from 'date-fns/locale'
import { Loader2, Plus, CalendarDays, X, Trash2, Briefcase, Clock, MapPin } from 'lucide-react'
import { toast } from 'sonner'
import { staffApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const DAY_OPTS: [string, number][] = [['Mån', 1], ['Tis', 2], ['Ons', 3], ['Tor', 4], ['Fre', 5], ['Lör', 6], ['Sön', 0]]

export default function WorkerHomePage() {
  const [jobs, setJobs]         = useState<any[]>([])
  const [schedule, setSchedule] = useState<any[]>([])
  const [loading, setLoading]   = useState(true)

  const [dayOpen, setDayOpen]   = useState(false)
  const [wDate, setWDate]       = useState('')
  const [wStart, setWStart]     = useState('08:00')
  const [wEnd, setWEnd]         = useState('17:00')
  const [savingDay, setSavingDay] = useState(false)

  const [rangeOpen, setRangeOpen] = useState(false)
  const [rStart, setRStart]     = useState('')
  const [rEnd, setREnd]         = useState('')
  const [rDays, setRDays]       = useState<number[]>([1, 2, 3, 4, 5])
  const [rS, setRS]             = useState('08:00')
  const [rE, setRE]             = useState('17:00')
  const [savingRange, setSavingRange] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const [j, s] = await Promise.all([
        staffApi.myJobsToday().catch(() => ({ data: [] as any[] })),
        staffApi.mySchedule(),
      ])
      setJobs(j.data ?? [])
      setSchedule(s.data ?? [])
    } catch {
      toast.error('Kunde inte hämta data.')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [])

  const addDay = async () => {
    if (!wDate) { toast.error('Välj ett datum.'); return }
    setSavingDay(true)
    try {
      await staffApi.addMyDay({ workDate: wDate, startTime: wStart, endTime: wEnd, isAvailable: true })
      toast.success('Dag sparad.'); setWDate(''); setDayOpen(false); load()
    } catch (e: any) { toast.error(e?.message ?? 'Kunde inte spara.') } finally { setSavingDay(false) }
  }

  const addRange = async () => {
    if (!rStart || !rEnd) { toast.error('Välj start- och slutdatum.'); return }
    if (rDays.length === 0) { toast.error('Välj minst en veckodag.'); return }
    setSavingRange(true)
    try {
      const res = await staffApi.addMyRange({ startDate: rStart, endDate: rEnd, weekdays: rDays, startTime: rS, endTime: rE, isAvailable: true })
      toast.success(`${res.data?.count ?? 0} dagar tillagda.`); setRStart(''); setREnd(''); setRangeOpen(false); load()
    } catch (e: any) { toast.error(e?.message ?? 'Kunde inte spara.') } finally { setSavingRange(false) }
  }

  const del = async (id: string) => {
    try {
      await staffApi.deleteMyDay(id)
      setSchedule((prev) => prev.filter((s) => s.id !== id))
      toast.success('Borttagen.')
    } catch (e: any) { toast.error(e?.message ?? 'Kunde inte ta bort.') }
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-neutral-400" size={24} /></div>

  return (
    <div className="space-y-8">
      {/* Today's jobs */}
      <section>
        <h2 className="font-display text-xl text-neutral-900 mb-3 flex items-center gap-2">
          <Briefcase size={18} className="text-brand-600" /> Dagens jobb
        </h2>
        {jobs.length === 0 ? (
          <div className="bg-white border border-dashed border-neutral-200 rounded-xl p-6 text-center text-sm text-neutral-400">Inga jobb idag.</div>
        ) : (
          <div className="space-y-2">
            {jobs.map((j) => (
              <div key={j.id} className="bg-white border border-neutral-200 rounded-xl p-3 flex items-center gap-3">
                <span className="text-sm font-bold text-brand-700 w-12 text-center">{format(new Date(j.scheduledAt), 'HH:mm')}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-800 truncate">{j.customer?.fullName ?? 'Kund'}</p>
                  {j.property && <p className="text-xs text-neutral-400 flex items-center gap-1 truncate"><MapPin size={11} /> {j.property.addressLine1}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Availability */}
      <section>
        <h2 className="font-display text-xl text-neutral-900 mb-1 flex items-center gap-2">
          <CalendarDays size={18} className="text-teal-600" /> Min tillgänglighet
        </h2>
        <p className="text-sm text-neutral-500 mb-3">Lägg till de dagar och tider du kan arbeta.</p>

        <div className="flex flex-wrap gap-2 mb-4">
          <Button size="sm" onClick={() => { setDayOpen((v) => !v); setRangeOpen(false) }}>
            {dayOpen ? <X size={14} /> : <Plus size={14} />}{dayOpen ? 'Avbryt' : 'Lägg till dag'}
          </Button>
          <Button size="sm" variant="outline" onClick={() => { setRangeOpen((v) => !v); setDayOpen(false) }}>
            <CalendarDays size={14} />{rangeOpen ? 'Avbryt intervall' : 'Datumintervall'}
          </Button>
        </div>

        {dayOpen && (
          <div className="bg-white border border-neutral-200 rounded-xl p-3 mb-4 flex flex-wrap items-end gap-2">
            <div>
              <label className="block text-xs text-neutral-500 mb-0.5">Datum</label>
              <input type="date" value={wDate} onChange={(e) => setWDate(e.target.value)} className="text-sm border border-neutral-200 rounded-lg px-2 py-1.5" />
            </div>
            <div>
              <label className="block text-xs text-neutral-500 mb-0.5">Start</label>
              <input type="time" value={wStart} onChange={(e) => setWStart(e.target.value)} className="text-sm border border-neutral-200 rounded-lg px-2 py-1.5" />
            </div>
            <div>
              <label className="block text-xs text-neutral-500 mb-0.5">Slut</label>
              <input type="time" value={wEnd} onChange={(e) => setWEnd(e.target.value)} className="text-sm border border-neutral-200 rounded-lg px-2 py-1.5" />
            </div>
            <Button size="sm" onClick={addDay} loading={savingDay}>Spara dag</Button>
          </div>
        )}

        {rangeOpen && (
          <div className="bg-white border border-neutral-200 rounded-xl p-3 mb-4 space-y-3">
            <div className="flex flex-wrap items-end gap-2">
              <div><label className="block text-xs text-neutral-500 mb-0.5">Från</label>
                <input type="date" value={rStart} onChange={(e) => setRStart(e.target.value)} className="text-sm border border-neutral-200 rounded-lg px-2 py-1.5" /></div>
              <div><label className="block text-xs text-neutral-500 mb-0.5">Till</label>
                <input type="date" value={rEnd} onChange={(e) => setREnd(e.target.value)} className="text-sm border border-neutral-200 rounded-lg px-2 py-1.5" /></div>
              <div><label className="block text-xs text-neutral-500 mb-0.5">Start</label>
                <input type="time" value={rS} onChange={(e) => setRS(e.target.value)} className="text-sm border border-neutral-200 rounded-lg px-2 py-1.5" /></div>
              <div><label className="block text-xs text-neutral-500 mb-0.5">Slut</label>
                <input type="time" value={rE} onChange={(e) => setRE(e.target.value)} className="text-sm border border-neutral-200 rounded-lg px-2 py-1.5" /></div>
            </div>
            <div>
              <label className="block text-xs text-neutral-500 mb-1">Veckodagar</label>
              <div className="flex flex-wrap gap-1.5">
                {DAY_OPTS.map(([lbl, num]) => {
                  const on = rDays.includes(num)
                  return (
                    <button key={num} type="button"
                      onClick={() => setRDays(on ? rDays.filter((x) => x !== num) : [...rDays, num])}
                      className={cn('px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors',
                        on ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300')}>
                      {lbl}
                    </button>
                  )
                })}
              </div>
            </div>
            <Button size="sm" onClick={addRange} loading={savingRange}>Spara intervall</Button>
          </div>
        )}

        {schedule.length === 0 ? (
          <div className="bg-white border border-dashed border-neutral-200 rounded-xl p-6 text-center text-sm text-neutral-400">Ingen tillgänglighet inlagd ännu.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {schedule.map((s) => (
              <div key={s.id} className={cn('bg-white border rounded-xl px-3 py-2.5 flex items-center gap-3', s.isAvailable ? 'border-neutral-200' : 'border-neutral-100 opacity-60')}>
                <span className="w-10 h-10 rounded-lg bg-teal-50 text-teal-700 flex flex-col items-center justify-center leading-none shrink-0">
                  <span className="text-[9px] uppercase">{format(new Date(s.workDate), 'MMM', { locale: sv })}</span>
                  <span className="text-sm font-bold">{format(new Date(s.workDate), 'd')}</span>
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-800 capitalize">{format(new Date(s.workDate), 'EEEE', { locale: sv })}</p>
                  <p className="text-xs text-neutral-400 flex items-center gap-1"><Clock size={11} /> {s.startTime}–{s.endTime}</p>
                </div>
                <button onClick={() => del(s.id)} className="p-1.5 rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-colors"><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
