'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { sv } from 'date-fns/locale'
import { Loader2, Plus, X, CalendarDays, Briefcase } from 'lucide-react'
import { toast } from 'sonner'
import { adminApi } from '@/lib/api'
import { Button } from '@/components/ui/button'

export default function AdminWorkersPage() {
  const [workers, setWorkers] = useState<any[]>([])
  const [loading,  setLoading] = useState(true)
  const [openForm, setOpenForm] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const res = await adminApi.workers()
      setWorkers(res.data ?? [])
    } catch {
      toast.error('Kunde inte hämta personal.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-neutral-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl text-neutral-900">Personal</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Schema, arbetstimmar och tilldelade jobb per städare.
        </p>
      </div>

      {workers.length === 0 ? (
        <div className="bg-white border border-dashed border-neutral-200 rounded-xl p-10 text-center text-sm text-neutral-500">
          Inga städare registrerade ännu.
        </div>
      ) : (
        <div className="space-y-4">
          {workers.map((w) => (
            <WorkerCard
              key={w.id}
              worker={w}
              isFormOpen={openForm === w.id}
              onToggleForm={() => setOpenForm(openForm === w.id ? null : w.id)}
              onScheduleAdded={load}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function WorkerCard({
  worker, isFormOpen, onToggleForm, onScheduleAdded,
}: {
  worker: any
  isFormOpen: boolean
  onToggleForm: () => void
  onScheduleAdded: () => void
}) {
  const [workDate,  setWorkDate]  = useState('')
  const [startTime, setStartTime] = useState('08:00')
  const [endTime,   setEndTime]   = useState('17:00')
  const [saving,    setSaving]    = useState(false)

  const submitSchedule = async () => {
    if (!workDate) {
      toast.error('Välj ett datum.')
      return
    }
    setSaving(true)
    try {
      await adminApi.addStaffSchedule(worker.id, { workDate, startTime, endTime, isAvailable: true })
      toast.success('Schema sparat.')
      setWorkDate('')
      onScheduleAdded()
      onToggleForm()
    } catch (err: any) {
      toast.error(err?.message ?? 'Kunde inte spara schema.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white border border-neutral-200 rounded-xl p-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
        <div>
          <p className="text-sm font-medium text-neutral-900">{worker.fullName}</p>
          <p className="text-xs text-neutral-400">{worker.email}{worker.phone ? ` · ${worker.phone}` : ''}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-center">
            <p className="font-display text-xl text-brand-700">{worker.totalScheduledHours}</p>
            <p className="text-[11px] text-neutral-400">tim / 30 dgr</p>
          </div>
          <div className="text-center">
            <p className="font-display text-xl text-teal-700">{worker.assignedJobCount}</p>
            <p className="text-[11px] text-neutral-400">tilldelade jobb</p>
          </div>
          <Button size="sm" variant="outline" onClick={onToggleForm}>
            {isFormOpen ? <X size={14} /> : <Plus size={14} />}
            {isFormOpen ? 'Stäng' : 'Lägg till schema'}
          </Button>
        </div>
      </div>

      {/* Add schedule form */}
      {isFormOpen && (
        <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4 mb-4 flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs text-neutral-500 mb-1">Datum</label>
            <input
              type="date"
              value={workDate}
              onChange={(e) => setWorkDate(e.target.value)}
              className="text-sm border border-neutral-200 rounded-lg px-3 py-1.5"
            />
          </div>
          <div>
            <label className="block text-xs text-neutral-500 mb-1">Starttid</label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="text-sm border border-neutral-200 rounded-lg px-3 py-1.5"
            />
          </div>
          <div>
            <label className="block text-xs text-neutral-500 mb-1">Sluttid</label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="text-sm border border-neutral-200 rounded-lg px-3 py-1.5"
            />
          </div>
          <Button size="sm" onClick={submitSchedule} loading={saving}>
            Spara
          </Button>
        </div>
      )}

      {/* Schedule + jobs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <p className="text-xs font-medium text-neutral-500 mb-2 flex items-center gap-1.5">
            <CalendarDays size={12} /> Schema (30 dgr)
          </p>
          {worker.schedule?.length === 0 ? (
            <p className="text-xs text-neutral-400">Inget schema inlagt.</p>
          ) : (
            <ul className="space-y-1 max-h-40 overflow-y-auto">
              {worker.schedule.map((d: any) => (
                <li key={d.id} className="flex items-center justify-between text-xs text-neutral-600">
                  <span className="capitalize">{format(new Date(d.workDate), 'EEE d MMM', { locale: sv })}</span>
                  <span className={d.isAvailable ? 'text-neutral-700' : 'text-neutral-400 line-through'}>
                    {d.startTime}–{d.endTime}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <p className="text-xs font-medium text-neutral-500 mb-2 flex items-center gap-1.5">
            <Briefcase size={12} /> Tilldelade jobb
          </p>
          {worker.assignedJobs?.length === 0 ? (
            <p className="text-xs text-neutral-400">Inga tilldelade jobb.</p>
          ) : (
            <ul className="space-y-1.5 max-h-40 overflow-y-auto">
              {worker.assignedJobs.map((j: any) => (
                <li key={j.id} className="text-xs text-neutral-600">
                  <span className="font-medium text-neutral-800">{j.customer?.fullName}</span>
                  {' — '}
                  <span className="capitalize">{format(new Date(j.scheduledAt), 'EEE d MMM HH:mm', { locale: sv })}</span>
                  {j.property && <span className="text-neutral-400"> · {j.property.addressLine1}</span>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
