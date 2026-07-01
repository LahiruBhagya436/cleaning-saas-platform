'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { format } from 'date-fns'
import { sv } from 'date-fns/locale'
import {
  Loader2, Plus, X, CalendarDays, Briefcase, UserPlus,
  CheckCircle2, Copy, Pencil, Trash2, ChevronDown, ChevronUp,
  Phone, Mail, MapPin, CreditCard, Shield, AlertTriangle, User2,
} from 'lucide-react'
import { toast } from 'sonner'
import { adminApi } from '@/lib/api'
import { Button } from '@/components/ui/button'

// ── helpers ───────────────────────────────────────────────────────────────────

function maskBankAccount(raw: string | null | undefined): string {
  if (!raw) return '—'
  // If it's encrypted (contains ':'), just show masked
  if (raw.includes(':')) return '••••••••'
  return raw.slice(0, 4) + ' •••• •••• ' + raw.slice(-4)
}

function hoursBetween(s: string, e: string) {
  const [sh, sm] = s.split(':').map(Number)
  const [eh, em] = e.split(':').map(Number)
  return (eh * 60 + em - (sh * 60 + sm)) / 60
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AdminWorkersPage() {
  const { data: session } = useSession()
  const role = (session?.user as any)?.role
  const canManage = role === 'admin' || role === 'superadmin'

  const [workers, setWorkers]   = useState<any[]>([])
  const [loading, setLoading]   = useState(true)
  const [showAdd, setShowAdd]   = useState(false)
  const [editId,  setEditId]    = useState<string | null>(null)
  const [expandId, setExpandId] = useState<string | null>(null)
  const [scheduleFor, setScheduleFor] = useState<string | null>(null)

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

  const handleDeactivate = async (id: string, name: string) => {
    if (!confirm(`Avaktivera ${name}? Personen tas bort från kommande bokningar.`)) return
    try {
      await adminApi.deleteWorker(id)
      toast.success(`${name} avaktiverad.`)
      load()
    } catch (err: any) {
      toast.error(err?.message ?? 'Kunde inte avaktivera.')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-neutral-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-2xl text-neutral-900">Personal</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Hantera städare och arbetsledare — schema, profil och anställningsdetaljer.
          </p>
        </div>
        {canManage && (
          <Button size="sm" onClick={() => { setShowAdd((v) => !v); setEditId(null) }}>
            {showAdd ? <X size={14} /> : <UserPlus size={14} />}
            {showAdd ? 'Avbryt' : 'Lägg till personal'}
          </Button>
        )}
      </div>

      {/* Add / Edit form */}
      {(showAdd || editId) && (
        <WorkerForm
          workerId={editId}
          onDone={() => { setShowAdd(false); setEditId(null); load() }}
          onCancel={() => { setShowAdd(false); setEditId(null) }}
        />
      )}

      {/* Stats bar */}
      {workers.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Totalt personal" value={workers.length} />
          <StatCard label="Aktiva" value={workers.filter((w) => w.isActive).length} color="teal" />
          <StatCard label="Inaktiva" value={workers.filter((w) => !w.isActive).length} color="neutral" />
        </div>
      )}

      {/* Worker list */}
      {workers.length === 0 ? (
        <div className="bg-white border border-dashed border-neutral-200 rounded-xl p-10 text-center text-sm text-neutral-500">
          Inga medarbetare registrerade ännu. Klicka "Lägg till personal" för att börja.
        </div>
      ) : (
        <div className="space-y-3">
          {workers.map((w) => (
            <WorkerRow
              key={w.id}
              worker={w}
              canManage={canManage}
              expanded={expandId === w.id}
              scheduleOpen={scheduleFor === w.id}
              onToggleExpand={() => setExpandId(expandId === w.id ? null : w.id)}
              onToggleSchedule={() => setScheduleFor(scheduleFor === w.id ? null : w.id)}
              onEdit={() => { setEditId(w.id); setShowAdd(false); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
              onDeactivate={() => handleDeactivate(w.id, w.fullName)}
              onScheduleAdded={load}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Stat card ──────────────────────────────────────────────────────────────────

function StatCard({ label, value, color = 'brand' }: { label: string; value: number; color?: string }) {
  const colors: Record<string, string> = {
    brand: 'text-brand-700',
    teal:  'text-teal-700',
    neutral: 'text-neutral-400',
  }
  return (
    <div className="bg-white border border-neutral-200 rounded-xl p-4 text-center">
      <p className={`font-display text-3xl ${colors[color] ?? colors.brand}`}>{value}</p>
      <p className="text-xs text-neutral-500 mt-1">{label}</p>
    </div>
  )
}

// ── Worker row with expandable profile ────────────────────────────────────────

function WorkerRow({
  worker, canManage, expanded, scheduleOpen,
  onToggleExpand, onToggleSchedule, onEdit, onDeactivate, onScheduleAdded,
}: {
  worker: any; canManage: boolean; expanded: boolean; scheduleOpen: boolean
  onToggleExpand: () => void; onToggleSchedule: () => void
  onEdit: () => void; onDeactivate: () => void; onScheduleAdded: () => void
}) {
  const [workDate,  setWorkDate]  = useState('')
  const [startTime, setStartTime] = useState('08:00')
  const [endTime,   setEndTime]   = useState('17:00')
  const [saving,    setSaving]    = useState(false)

  const submitSchedule = async () => {
    if (!workDate) { toast.error('Välj ett datum.'); return }
    setSaving(true)
    try {
      await adminApi.addStaffSchedule(worker.id, { workDate, startTime, endTime, isAvailable: true })
      toast.success('Schema sparat.')
      setWorkDate('')
      onScheduleAdded()
      onToggleSchedule()
    } catch (err: any) {
      toast.error(err?.message ?? 'Kunde inte spara schema.')
    } finally {
      setSaving(false)
    }
  }

  const totalHours = (worker.schedule ?? [])
    .filter((d: any) => d.isAvailable)
    .reduce((s: number, d: any) => s + hoursBetween(d.startTime, d.endTime), 0)

  return (
    <div className={`bg-white border rounded-xl overflow-hidden transition-all ${worker.isActive ? 'border-neutral-200' : 'border-neutral-100 opacity-60'}`}>
      {/* Row header */}
      <div className="flex flex-wrap items-center gap-3 px-5 py-4">
        {/* Avatar */}
        <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center shrink-0">
          <span className="text-sm font-semibold text-brand-700">
            {worker.fullName.split(' ').map((n: string) => n[0]).slice(0, 2).join('')}
          </span>
        </div>

        {/* Name + meta */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-neutral-900">{worker.fullName}</p>
            <RoleBadge role={worker.role} />
            {!worker.isActive && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-400">Inaktiv</span>
            )}
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">
            {worker.email}{worker.phone ? ` · ${worker.phone}` : ''}
          </p>
        </div>

        {/* Stats */}
        <div className="hidden sm:flex items-center gap-5 text-center">
          <div>
            <p className="font-display text-lg text-brand-700">{totalHours}</p>
            <p className="text-[11px] text-neutral-400">tim / 30 dgr</p>
          </div>
          <div>
            <p className="font-display text-lg text-teal-700">{worker.assignedJobCount ?? 0}</p>
            <p className="text-[11px] text-neutral-400">jobb</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {canManage && (
            <>
              <button
                onClick={onEdit}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                title="Redigera profil"
              >
                <Pencil size={14} />
              </button>
              {worker.isActive && (
                <button
                  onClick={onDeactivate}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  title="Avaktivera"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </>
          )}
          <button
            onClick={onToggleExpand}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 transition-colors"
            title={expanded ? 'Dölj detaljer' : 'Visa detaljer'}
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Expanded section */}
      {expanded && (
        <div className="border-t border-neutral-100 px-5 py-4 space-y-5">
          {/* Profile details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <ProfileField icon={<MapPin size={12} />} label="Adress">
              {worker.addressLine1
                ? `${worker.addressLine1}, ${worker.postalCode ?? ''} ${worker.city ?? ''}`
                : '—'}
            </ProfileField>
            <ProfileField icon={<CreditCard size={12} />} label="Bankkonto">
              {worker.bankClearingNo
                ? `Clearingnr: ${worker.bankClearingNo}`
                : '—'}
              {worker.bankAccountEnc && (
                <span className="block text-neutral-400">Konto: {maskBankAccount(worker.bankAccountEnc)}</span>
              )}
            </ProfileField>
            <ProfileField icon={<Shield size={12} />} label="Personnummer">
              {worker.personnummerEnc ? '••••••-••••' : '—'}
            </ProfileField>
            <ProfileField icon={<AlertTriangle size={12} />} label="Nödkontakt">
              {worker.emergencyContact
                ? `${worker.emergencyContact}${worker.emergencyPhone ? ` — ${worker.emergencyPhone}` : ''}`
                : '—'}
            </ProfileField>
            <ProfileField icon={<User2 size={12} />} label="Anställningsdatum">
              {worker.hireDate
                ? format(new Date(worker.hireDate), 'd MMM yyyy', { locale: sv })
                : '—'}
            </ProfileField>
            <ProfileField icon={<Mail size={12} />} label="Anteckningar">
              {worker.employmentNotes ?? '—'}
            </ProfileField>
          </div>

          {/* Schedule + jobs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2 border-t border-neutral-100">
            <div>
              <p className="text-xs font-semibold text-neutral-500 mb-2 flex items-center gap-1.5">
                <CalendarDays size={12} /> Schema (30 dagar)
              </p>
              {(worker.schedule?.length ?? 0) === 0 ? (
                <p className="text-xs text-neutral-400">Inget schema inlagt.</p>
              ) : (
                <ul className="space-y-1 max-h-36 overflow-y-auto">
                  {worker.schedule.map((d: any) => (
                    <li key={d.id} className="flex justify-between text-xs text-neutral-600">
                      <span className="capitalize">{format(new Date(d.workDate), 'EEE d MMM', { locale: sv })}</span>
                      <span className={d.isAvailable ? 'text-neutral-700' : 'text-neutral-400 line-through'}>
                        {d.startTime}–{d.endTime}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              {canManage && (
                <button
                  onClick={onToggleSchedule}
                  className="mt-2 text-xs text-brand-600 hover:underline flex items-center gap-1"
                >
                  <Plus size={11} /> Lägg till schemadag
                </button>
              )}
              {scheduleOpen && (
                <div className="mt-3 bg-neutral-50 border border-neutral-200 rounded-lg p-3 space-y-2">
                  <div className="flex flex-wrap gap-2">
                    <div>
                      <label className="block text-xs text-neutral-500 mb-0.5">Datum</label>
                      <input type="date" value={workDate} onChange={(e) => setWorkDate(e.target.value)}
                        className="text-xs border border-neutral-200 rounded-lg px-2 py-1.5" />
                    </div>
                    <div>
                      <label className="block text-xs text-neutral-500 mb-0.5">Start</label>
                      <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)}
                        className="text-xs border border-neutral-200 rounded-lg px-2 py-1.5" />
                    </div>
                    <div>
                      <label className="block text-xs text-neutral-500 mb-0.5">Slut</label>
                      <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)}
                        className="text-xs border border-neutral-200 rounded-lg px-2 py-1.5" />
                    </div>
                  </div>
                  <Button size="sm" onClick={submitSchedule} loading={saving}>Spara dag</Button>
                </div>
              )}
            </div>

            <div>
              <p className="text-xs font-semibold text-neutral-500 mb-2 flex items-center gap-1.5">
                <Briefcase size={12} /> Tilldelade jobb
              </p>
              {(worker.assignedJobs?.length ?? 0) === 0 ? (
                <p className="text-xs text-neutral-400">Inga tilldelade jobb.</p>
              ) : (
                <ul className="space-y-1.5 max-h-36 overflow-y-auto">
                  {worker.assignedJobs.map((j: any) => (
                    <li key={j.id} className="text-xs text-neutral-600">
                      <span className="font-medium text-neutral-800">{j.customer?.fullName}</span>
                      {' — '}
                      <span>{format(new Date(j.scheduledAt), 'EEE d MMM HH:mm', { locale: sv })}</span>
                      {j.property && <span className="text-neutral-400"> · {j.property.addressLine1}</span>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Profile field helper ──────────────────────────────────────────────────────

function ProfileField({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium text-neutral-400 flex items-center gap-1 mb-0.5">
        {icon} {label}
      </p>
      <p className="text-sm text-neutral-700">{children}</p>
    </div>
  )
}

// ── Role badge ────────────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: string }) {
  if (role === 'coordinator') {
    return (
      <span className="text-2xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 font-medium">
        Arbetsledare
      </span>
    )
  }
  return (
    <span className="text-2xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium">
      Städare
    </span>
  )
}

// ── Worker create / edit form ─────────────────────────────────────────────────

function WorkerForm({
  workerId, onDone, onCancel,
}: {
  workerId: string | null
  onDone:   () => void
  onCancel: () => void
}) {
  const isEdit = !!workerId

  const [loading, setLoading] = useState(isEdit)
  const [saving,  setSaving]  = useState(false)
  const [created, setCreated] = useState<{ fullName: string; email: string; tempPassword: string } | null>(null)

  // Form state
  const [fullName,         setFullName]         = useState('')
  const [email,            setEmail]            = useState('')
  const [phone,            setPhone]            = useState('')
  const [role,             setRole]             = useState<'staff' | 'coordinator'>('staff')
  const [personnummer,     setPersonnummer]     = useState('')
  const [addressLine1,     setAddressLine1]     = useState('')
  const [city,             setCity]             = useState('')
  const [postalCode,       setPostalCode]       = useState('')
  const [bankAccount,      setBankAccount]      = useState('')
  const [bankClearingNo,   setBankClearingNo]   = useState('')
  const [emergencyContact, setEmergencyContact] = useState('')
  const [emergencyPhone,   setEmergencyPhone]   = useState('')
  const [hireDate,         setHireDate]         = useState('')
  const [employmentNotes,  setEmploymentNotes]  = useState('')

  // Load existing data when editing
  useEffect(() => {
    if (!workerId) return
    ;(async () => {
      try {
        const res = await adminApi.getWorker(workerId)
        const w = res.data
        setFullName(w.fullName ?? '')
        setEmail(w.email ?? '')
        setPhone(w.phone ?? '')
        setRole(w.role ?? 'staff')
        setAddressLine1(w.addressLine1 ?? '')
        setCity(w.city ?? '')
        setPostalCode(w.postalCode ?? '')
        setBankClearingNo(w.bankClearingNo ?? '')
        setEmergencyContact(w.emergencyContact ?? '')
        setEmergencyPhone(w.emergencyPhone ?? '')
        setEmploymentNotes(w.employmentNotes ?? '')
        if (w.hireDate) setHireDate(w.hireDate.slice(0, 10))
      } catch {
        toast.error('Kunde inte ladda profil.')
        onCancel()
      } finally {
        setLoading(false)
      }
    })()
  }, [workerId])

  const submit = async () => {
    if (!fullName.trim()) { toast.error('Namn krävs.'); return }
    if (!isEdit && !email.trim()) { toast.error('E-post krävs.'); return }
    setSaving(true)
    try {
      if (isEdit) {
        await adminApi.updateWorker(workerId!, {
          fullName: fullName.trim(),
          phone:    phone.trim() || null,
          role,
          personnummer:     personnummer || null,
          addressLine1:     addressLine1.trim() || null,
          city:             city.trim() || null,
          postalCode:       postalCode.trim() || null,
          bankAccount:      bankAccount.trim() || null,
          bankClearingNo:   bankClearingNo.trim() || null,
          emergencyContact: emergencyContact.trim() || null,
          emergencyPhone:   emergencyPhone.trim() || null,
          hireDate:         hireDate || null,
          employmentNotes:  employmentNotes.trim() || null,
        })
        toast.success('Profil uppdaterad.')
        onDone()
      } else {
        const res = await adminApi.createWorker({
          email:     email.trim(),
          fullName:  fullName.trim(),
          phone:     phone.trim() || undefined,
          role,
          personnummer:     personnummer || undefined,
          addressLine1:     addressLine1.trim() || undefined,
          city:             city.trim() || undefined,
          postalCode:       postalCode.trim() || undefined,
          bankAccount:      bankAccount.trim() || undefined,
          bankClearingNo:   bankClearingNo.trim() || undefined,
          emergencyContact: emergencyContact.trim() || undefined,
          emergencyPhone:   emergencyPhone.trim() || undefined,
          hireDate:         hireDate || undefined,
          employmentNotes:  employmentNotes.trim() || undefined,
        })
        if (res.data?.tempPassword) {
          setCreated({ fullName: fullName.trim(), email: email.trim(), tempPassword: res.data.tempPassword })
        } else {
          toast.success('Medarbetare skapad.')
          onDone()
        }
      }
    } catch (err: any) {
      toast.error(err?.message ?? 'Kunde inte spara.')
    } finally {
      setSaving(false)
    }
  }

  // Show credentials card after creation
  if (created) {
    return (
      <div className="bg-white border border-teal-200 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <CheckCircle2 size={16} className="text-teal-500 shrink-0" />
          <p className="text-sm font-semibold text-neutral-900">
            {role === 'coordinator' ? 'Arbetsledare skapad!' : 'Städare skapad!'}
          </p>
        </div>
        <p className="text-xs text-neutral-600">
          Dela inloggningsuppgifterna med <strong>{created.fullName}</strong>. Be dem logga in och byta lösenord direkt.
        </p>
        <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3 space-y-2 text-xs font-mono">
          <div><span className="text-neutral-400">E-post: </span>{created.email}</div>
          <div className="flex items-center justify-between">
            <span><span className="text-neutral-400">Lösenord: </span>{created.tempPassword}</span>
            <button
              onClick={() => { navigator.clipboard.writeText(created.tempPassword); toast.success('Kopierat!') }}
              className="p-1 text-neutral-400 hover:text-neutral-700 transition-colors"
              title="Kopiera lösenord"
            >
              <Copy size={12} />
            </button>
          </div>
        </div>
        <Button size="sm" variant="outline" onClick={onDone}>Klar</Button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="bg-white border border-neutral-200 rounded-xl p-6 flex justify-center">
        <Loader2 size={20} className="animate-spin text-neutral-400" />
      </div>
    )
  }

  return (
    <div className="bg-white border border-brand-200 rounded-xl p-5 space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-neutral-900">
          {isEdit ? 'Redigera profil' : 'Lägg till ny medarbetare'}
        </p>
        <button onClick={onCancel} className="text-neutral-400 hover:text-neutral-700 transition-colors">
          <X size={16} />
        </button>
      </div>

      {/* Section: Basic info */}
      <FormSection title="Grunduppgifter">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label="Fullständigt namn *">
            <input value={fullName} onChange={(e) => setFullName(e.target.value)}
              className="form-input" placeholder="Anna Andersson" />
          </FormField>
          {!isEdit && (
            <FormField label="E-postadress *">
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="form-input" placeholder="anna@exempel.se" />
            </FormField>
          )}
          <FormField label="Telefon">
            <input value={phone} onChange={(e) => setPhone(e.target.value)}
              className="form-input" placeholder="+46 70X XXX XX XX" />
          </FormField>
          <FormField label="Roll">
            <div className="flex gap-2">
              {(['staff', 'coordinator'] as const).map((r) => (
                <button key={r} type="button" onClick={() => setRole(r)}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-colors ${
                    role === r ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300'
                  }`}>
                  {r === 'staff' ? 'Städare' : 'Arbetsledare'}
                </button>
              ))}
            </div>
          </FormField>
          <FormField label="Anställningsdatum">
            <input type="date" value={hireDate} onChange={(e) => setHireDate(e.target.value)}
              className="form-input" />
          </FormField>
        </div>
      </FormSection>

      {/* Section: Address */}
      <FormSection title="Adress">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <FormField label="Gatuadress" className="sm:col-span-3">
            <input value={addressLine1} onChange={(e) => setAddressLine1(e.target.value)}
              className="form-input" placeholder="Storgatan 1" />
          </FormField>
          <FormField label="Postnummer">
            <input value={postalCode} onChange={(e) => setPostalCode(e.target.value)}
              className="form-input" placeholder="123 45" />
          </FormField>
          <FormField label="Ort" className="sm:col-span-2">
            <input value={city} onChange={(e) => setCity(e.target.value)}
              className="form-input" placeholder="Stockholm" />
          </FormField>
        </div>
      </FormSection>

      {/* Section: Personal / bank (sensitive) */}
      <FormSection title="Känsliga uppgifter" hint="Krypteras och lagras säkert">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label={isEdit ? 'Personnummer (lämna tomt = ändra ej)' : 'Personnummer'}>
            <input value={personnummer} onChange={(e) => setPersonnummer(e.target.value)}
              className="form-input" placeholder="ÅÅMMDD-XXXX" />
          </FormField>
          <FormField label="Clearingnummer (bank)">
            <input value={bankClearingNo} onChange={(e) => setBankClearingNo(e.target.value)}
              className="form-input" placeholder="XXXX" />
          </FormField>
          <FormField label={isEdit ? 'Kontonummer (lämna tomt = ändra ej)' : 'Kontonummer'}>
            <input value={bankAccount} onChange={(e) => setBankAccount(e.target.value)}
              className="form-input" placeholder="XXXXXXXXXX" />
          </FormField>
        </div>
      </FormSection>

      {/* Section: Emergency contact */}
      <FormSection title="Nödkontakt">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label="Namn">
            <input value={emergencyContact} onChange={(e) => setEmergencyContact(e.target.value)}
              className="form-input" placeholder="Kontaktpersonens namn" />
          </FormField>
          <FormField label="Telefon">
            <input value={emergencyPhone} onChange={(e) => setEmergencyPhone(e.target.value)}
              className="form-input" placeholder="+46 70X XXX XX XX" />
          </FormField>
        </div>
      </FormSection>

      {/* Section: Notes */}
      <FormSection title="Interna anteckningar">
        <textarea
          value={employmentNotes}
          onChange={(e) => setEmploymentNotes(e.target.value)}
          rows={3}
          className="form-input w-full resize-none"
          placeholder="Anteckningar om anställning, erfarenhet, specialkompetens…"
        />
      </FormSection>

      <div className="flex items-center gap-3 pt-1">
        <Button size="sm" onClick={submit} loading={saving}>
          {isEdit ? 'Spara ändringar' : 'Skapa medarbetare'}
        </Button>
        <Button size="sm" variant="outline" onClick={onCancel}>Avbryt</Button>
      </div>
    </div>
  )
}

// ── Form helpers ──────────────────────────────────────────────────────────────

function FormSection({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-baseline gap-2 mb-3">
        <p className="text-xs font-semibold text-neutral-700 uppercase tracking-wide">{title}</p>
        {hint && <p className="text-xs text-neutral-400">{hint}</p>}
      </div>
      {children}
    </div>
  )
}

function FormField({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="block text-xs text-neutral-500 mb-1">{label}</label>
      {children}
    </div>
  )
}
