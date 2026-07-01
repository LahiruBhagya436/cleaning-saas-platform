'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { format } from 'date-fns'
import { sv } from 'date-fns/locale'
import { Loader2, Plus, X, CalendarDays, Briefcase, UserPlus, CheckCircle2, Copy } from 'lucide-react'
import { toast } from 'sonner'
import { adminApi } from '@/lib/api'
import { Button } from '@/components/ui/button'

export default function AdminWorkersPage() {
  const { data: session } = useSession()
  const role = (session?.user as any)?.role
  const canManageTeam = role === 'admin' || role === 'superadmin' // coordinators can assign jobs, not add people

  const [workers, setWorkers] = useState<any[]>([])
  const [loading,  setLoading] = useState(true)
  const [openForm, setOpenForm] = useState<string | null>(null)
  const [showAdd,  setShowAdd]  = useState(false)

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
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-2xl text-neutral-900">Personal</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Schema, arbetstimmar och tilldelade jobb per städare.
          </p>
        </div>
        {canManageTeam && (
          <Button size="sm" onClick={() => setShowAdd((v) => !v)}>
            {showAdd ? <X size={14} /> : <UserPlus size={14} />}
            {showAdd ? 'Stäng' : 'Lägg till städare / arbetsledare'}
          </Button>
        )}
      </div>

      {canManageTeam && showAdd && (
        <AddTeamMemberForm
          onAdded={() => {
            setShowAdd(false)
            load()
          }}
        />
      )}

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

      {canManageTeam && <SupervisorList />}
    </div>
  )
}

// ── Add cleaner / supervisor form (admin-only) ────────────────────────────────

function AddTeamMemberForm({ onAdded }: { onAdded: () => void }) {
  const [fullName, setFullName] = useState('')
  const [email,    setEmail]    = useState('')
  const [phone,    setPhone]    = useState('')
  const [role,     setRole]     = useState<'staff' | 'coordinator'>('staff')
  const [saving,   setSaving]   = useState(false)
  const [created,  setCreated]  = useState<{ fullName: string; email: string; tempPassword: string } | null>(null)

  const submit = async () => {
    if (!fullName.trim() || !email.trim()) {
      toast.error('Namn och e-post krävs.')
      return
    }
    setSaving(true)
    try {
      const res = await adminApi.addTeamMember({ fullName: fullName.trim(), email: email.trim(), phone: phone.trim() || undefined, role })
      // Show the temp password in the UI so admin can share it directly,
      // regardless of whether the invite email was delivered.
      if (res.data?.tempPassword) {
        setCreated({ fullName: fullName.trim(), email: email.trim(), tempPassword: res.data.tempPassword })
      } else {
        toast.success('Person tillagd.')
        onAdded()
      }
    } catch (err: any) {
      toast.error(err?.message ?? 'Kunde inte lägga till personen.')
    } finally {
      setSaving(false)
    }
  }

  // ── Show credentials card after successful creation ───────────────────────
  if (created) {
    return (
      <div className="bg-white border border-teal-200 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <CheckCircle2 size={16} className="text-teal-500 shrink-0" />
          <p className="text-sm font-medium text-neutral-900">
            {role === 'coordinator' ? 'Arbetsledare tillagd!' : 'Städare tillagd!'}
          </p>
        </div>
        <p className="text-xs text-neutral-600">
          Dela inloggningsuppgifterna direkt med <strong>{created.fullName}</strong> — e-postleverans är inte alltid garanterad.
        </p>
        <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3 space-y-2 text-xs font-mono">
          <div className="flex items-center justify-between gap-3">
            <span><span className="text-neutral-400">E-post: </span>{created.email}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span><span className="text-neutral-400">Lösenord: </span>{created.tempPassword}</span>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(created.tempPassword)
                toast.success('Lösenord kopierat!')
              }}
              className="p-1 text-neutral-400 hover:text-neutral-700 transition-colors shrink-0"
              title="Kopiera lösenord"
            >
              <Copy size={12} />
            </button>
          </div>
        </div>
        <p className="text-xs text-neutral-400">
          Be personen logga in med ovan uppgifter och byta lösenord direkt.
        </p>
        <Button size="sm" variant="outline" onClick={() => { setCreated(null); onAdded() }}>
          Klar
        </Button>
      </div>
    )
  }

  return (
    <div className="bg-white border border-neutral-200 rounded-xl p-5 space-y-4">
      <p className="text-sm font-medium text-neutral-900">Lägg till städare eller arbetsledare</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-neutral-500 mb-1">Namn</label>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full text-sm border border-neutral-200 rounded-lg px-3 py-2"
            placeholder="Anna Andersson"
          />
        </div>
        <div>
          <label className="block text-xs text-neutral-500 mb-1">E-post</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full text-sm border border-neutral-200 rounded-lg px-3 py-2"
            placeholder="anna@exempel.se"
          />
        </div>
        <div>
          <label className="block text-xs text-neutral-500 mb-1">Telefon (valfritt)</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full text-sm border border-neutral-200 rounded-lg px-3 py-2"
            placeholder="07X-XXX XX XX"
          />
        </div>
        <div>
          <label className="block text-xs text-neutral-500 mb-1">Roll</label>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => setRole('staff')}
              className={`px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                role === 'staff' ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300'
              }`}
            >
              Städare
            </button>
            <button
              type="button"
              onClick={() => setRole('coordinator')}
              className={`px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                role === 'coordinator' ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300'
              }`}
            >
              Arbetsledare
            </button>
          </div>
        </div>
      </div>
      <Button size="sm" onClick={submit} loading={saving}>
        Lägg till
      </Button>
    </div>
  )
}

// ── Supervisor ("coordinator") roster — read-only list, no schedules ─────────

function SupervisorList() {
  const [coordinators, setCoordinators] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      try {
        const res = await adminApi.team()
        setCoordinators((res.data ?? []).filter((m: any) => m.role === 'coordinator'))
      } catch {
        // silent — this section is supplementary
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  if (loading || coordinators.length === 0) return null

  return (
    <div>
      <h2 className="font-sans font-medium text-neutral-900 mb-3">Arbetsledare ({coordinators.length})</h2>
      <div className="bg-white border border-neutral-200 rounded-xl divide-y divide-neutral-50">
        {coordinators.map((c) => (
          <div key={c.id} className="px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-900">{c.fullName}</p>
              <p className="text-xs text-neutral-400">{c.email}{c.phone ? ` · ${c.phone}` : ''}</p>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full ${c.isActive ? 'bg-teal-50 text-teal-700' : 'bg-neutral-100 text-neutral-400'}`}>
              {c.isActive ? 'Aktiv' : 'Inaktiv'}
            </span>
          </div>
        ))}
      </div>
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
