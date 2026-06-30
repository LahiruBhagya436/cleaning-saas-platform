'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, Building2, Mail, Calendar, ToggleLeft, ToggleRight } from 'lucide-react'
import { platformApi } from '@/lib/api'
import { formatSEK, formatDate } from '@/lib/utils'
import { Badge } from '@/components/dashboard/Badge'
import { toast } from 'sonner'

const TIERS = ['starter', 'professional', 'enterprise']
const STATUSES = ['trialing', 'active', 'past_due', 'canceled']

export default function PlatformCompanyDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await platformApi.company(id)
      setData(res.data)
    } catch (err: any) {
      toast.error(err?.message ?? 'Could not load company')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])

  const update = async (patch: any) => {
    setSaving(true)
    try {
      await platformApi.updateCompany(id, patch)
      toast.success('Updated')
      await load()
    } catch (err: any) {
      toast.error(err?.message ?? 'Update failed')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-neutral-400" />
      </div>
    )
  }

  if (!data) return null
  const { company, users, recentBookings, revenue, paidInvoiceCount } = data

  return (
    <div className="space-y-8">
      <button
        onClick={() => router.push('/platform/companies')}
        className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-800"
      >
        <ArrowLeft size={14} /> Back to companies
      </button>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
            <Building2 size={20} />
          </div>
          <div>
            <h1 className="font-display text-2xl text-neutral-900">{company.name}</h1>
            <p className="text-sm text-neutral-500 flex items-center gap-3 mt-0.5">
              <span>{company.slug}</span>
              <span className="flex items-center gap-1"><Mail size={12} />{company.contactEmail}</span>
              <span className="flex items-center gap-1"><Calendar size={12} />Joined {formatDate(company.createdAt, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            </p>
          </div>
        </div>
        <button
          onClick={() => update({ isActive: !company.isActive })}
          disabled={saving}
          className="flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg border border-neutral-200 hover:bg-neutral-50 disabled:opacity-50"
        >
          {company.isActive ? (
            <><ToggleRight size={18} className="text-teal-600" /> Active</>
          ) : (
            <><ToggleLeft size={18} className="text-neutral-400" /> Disabled</>
          )}
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-neutral-200 rounded-xl p-4">
          <p className="font-display text-2xl text-neutral-900">{formatSEK(revenue, true)}</p>
          <p className="text-xs text-neutral-500 mt-0.5">Total revenue ({paidInvoiceCount} paid)</p>
        </div>
        <div className="bg-white border border-neutral-200 rounded-xl p-4">
          <p className="font-display text-2xl text-neutral-900">{users.length}</p>
          <p className="text-xs text-neutral-500 mt-0.5">Users</p>
        </div>
        <div className="bg-white border border-neutral-200 rounded-xl p-4">
          <p className="font-display text-2xl text-neutral-900">{recentBookings.length}</p>
          <p className="text-xs text-neutral-500 mt-0.5">Recent bookings</p>
        </div>
        <div className="bg-white border border-neutral-200 rounded-xl p-4">
          <p className="font-display text-2xl text-neutral-900">{company.stripeOnboarded ? 'Yes' : 'No'}</p>
          <p className="text-xs text-neutral-500 mt-0.5">Stripe onboarded</p>
        </div>
      </div>

      {/* Plan & billing controls */}
      <div className="bg-white border border-neutral-200 rounded-xl p-5 space-y-4">
        <h2 className="font-sans font-medium text-neutral-900">Plan & billing</h2>
        <div className="flex gap-6 flex-wrap">
          <div>
            <p className="text-xs text-neutral-500 mb-1.5">Subscription tier</p>
            <div className="flex gap-1.5">
              {TIERS.map((t) => (
                <button
                  key={t}
                  disabled={saving}
                  onClick={() => update({ subscriptionTier: t })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize border transition-colors ${
                    company.subscriptionTier === t
                      ? 'bg-brand-600 text-white border-brand-600'
                      : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs text-neutral-500 mb-1.5">Subscription status</p>
            <div className="flex gap-1.5">
              {STATUSES.map((s) => (
                <button
                  key={s}
                  disabled={saving}
                  onClick={() => update({ subscriptionStatus: s })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize border transition-colors ${
                    company.subscriptionStatus === s
                      ? 'bg-neutral-900 text-white border-neutral-900'
                      : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  {s.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
        </div>
        {company.trialEndsAt && (
          <p className="text-xs text-neutral-400">
            Trial ends {formatDate(company.trialEndsAt, { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        )}
      </div>

      {/* Users */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-sans font-medium text-neutral-900">Team ({users.length})</h2>
          <AddAdminButton companyId={id} adminCount={users.filter((u: any) => u.role === 'admin').length} onAdded={load} />
        </div>
        <div className="bg-white border border-neutral-200 rounded-xl divide-y divide-neutral-50">
          {users.map((u: any) => (
            <div key={u.id} className="px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-900">{u.fullName}</p>
                <p className="text-xs text-neutral-400">{u.email}</p>
              </div>
              <Badge className="text-neutral-600 bg-neutral-100 capitalize">{u.role}</Badge>
            </div>
          ))}
          {users.length === 0 && (
            <p className="px-4 py-6 text-sm text-neutral-400 text-center">No users yet.</p>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Add admin (platform-owner-only — server enforces the 2-email allowlist
// and the 5-admin-per-company cap; this UI just exposes the action and
// surfaces whatever the API decides, including a clean 403/409 message). ────

function AddAdminButton({ companyId, adminCount, onAdded }: { companyId: string; adminCount: number; onAdded: () => void }) {
  const [open,     setOpen]     = useState(false)
  const [fullName, setFullName] = useState('')
  const [email,    setEmail]    = useState('')
  const [phone,    setPhone]    = useState('')
  const [saving,   setSaving]   = useState(false)

  const atLimit = adminCount >= 5

  const submit = async () => {
    if (!fullName.trim() || !email.trim()) {
      toast.error('Name and email are required.')
      return
    }
    setSaving(true)
    try {
      await platformApi.addCompanyAdmin(companyId, { fullName: fullName.trim(), email: email.trim(), phone: phone.trim() || undefined })
      toast.success('Admin created — login details emailed.')
      setOpen(false)
      setFullName(''); setEmail(''); setPhone('')
      onAdded()
    } catch (err: any) {
      toast.error(err?.message ?? 'Could not create admin.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={atLimit}
        className="text-xs font-medium px-3 py-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
        title={atLimit ? 'This company already has the maximum of 5 admins' : undefined}
      >
        {atLimit ? 'Admin limit reached (5/5)' : '+ Add admin'}
      </button>
      {open && !atLimit && (
        <div className="absolute right-0 mt-2 w-72 bg-white border border-neutral-200 rounded-xl shadow-lg p-4 space-y-3 z-10">
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Full name"
            className="w-full text-sm border border-neutral-200 rounded-lg px-3 py-2"
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full text-sm border border-neutral-200 rounded-lg px-3 py-2"
          />
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Phone (optional)"
            className="w-full text-sm border border-neutral-200 rounded-lg px-3 py-2"
          />
          <button
            onClick={submit}
            disabled={saving}
            className="w-full text-sm font-medium px-3 py-2 rounded-lg bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {saving ? 'Creating…' : 'Create admin'}
          </button>
        </div>
      )}
    </div>
  )
}
