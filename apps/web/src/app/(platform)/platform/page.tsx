'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Building2, Users, CalendarDays, Banknote, TrendingUp, ArrowRight, Loader2 } from 'lucide-react'
import { platformApi } from '@/lib/api'
import { formatSEK } from '@/lib/utils'

export default function PlatformOverviewPage() {
  const [stats, setStats] = useState<any>(null)
  const [companies, setCompanies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      try {
        const [overviewRes, companiesRes] = await Promise.all([
          platformApi.overview(),
          platformApi.companies(),
        ])
        setStats(overviewRes.data)
        setCompanies((companiesRes.data ?? []).slice(0, 5))
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-neutral-400" />
      </div>
    )
  }

  const CARDS = [
    { label: 'Companies', value: stats?.companyCount ?? 0, sub: `${stats?.activeCompanyCount ?? 0} active · ${stats?.trialingCount ?? 0} trialing`, icon: Building2, color: 'text-brand-600 bg-brand-50' },
    { label: 'Total users', value: stats?.totalUsers ?? 0, sub: 'Across all companies', icon: Users, color: 'text-teal-600 bg-teal-50' },
    { label: 'Total bookings', value: stats?.totalBookings ?? 0, sub: `${stats?.paidInvoiceCount ?? 0} paid invoices`, icon: CalendarDays, color: 'text-amber-600 bg-amber-50' },
    { label: 'Gross volume', value: formatSEK(stats?.gmv ?? 0, true), sub: 'Total paid by customers', icon: Banknote, color: 'text-neutral-700 bg-neutral-100' },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl text-neutral-900">Platform overview</h1>
        <p className="text-sm text-neutral-500 mt-1">How the whole SaaS is doing, across every company.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {CARDS.map(({ label, value, sub, icon: Icon, color }) => (
          <div key={label} className="bg-white border border-neutral-200 rounded-xl p-4">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${color}`}>
              <Icon size={16} />
            </div>
            <p className="font-display text-2xl text-neutral-900">{value}</p>
            <p className="text-xs text-neutral-500 mt-0.5">{label}</p>
            <p className="text-[11px] text-neutral-400 mt-1">{sub}</p>
          </div>
        ))}
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 flex items-center gap-4">
        <div className="w-10 h-10 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0">
          <TrendingUp size={18} />
        </div>
        <div>
          <p className="text-sm font-medium text-amber-900">
            Estimated platform revenue: {formatSEK(stats?.estimatedPlatformRevenue ?? 0)}
          </p>
          <p className="text-xs text-amber-700 mt-0.5">
            {stats?.platformFeePercent ?? 2.5}% application fee on {formatSEK(stats?.gmv ?? 0)} gross volume. Subscription revenue isn't included yet.
          </p>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-sans font-medium text-neutral-900">Newest companies</h2>
          <Link href="/platform/companies" className="text-xs text-brand-600 hover:underline flex items-center gap-1">
            See all <ArrowRight size={12} />
          </Link>
        </div>

        <div className="space-y-3">
          {companies.map((c) => (
            <Link
              key={c.id}
              href={`/platform/companies/${c.id}`}
              className="bg-white border border-neutral-200 rounded-xl p-4 flex items-center justify-between gap-4 hover:border-neutral-300 transition-colors"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-neutral-900">{c.name}</p>
                <p className="text-xs text-neutral-500 mt-0.5">{c.slug} · {c.userCount} users · {c.bookingCount} bookings</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-medium text-neutral-900">{formatSEK(c.revenue, true)}</p>
                <p className="text-xs text-neutral-400 capitalize">{c.subscriptionStatus}</p>
              </div>
            </Link>
          ))}
          {companies.length === 0 && (
            <p className="text-sm text-neutral-400 text-center py-8">No companies have signed up yet.</p>
          )}
        </div>
      </div>
    </div>
  )
}
