'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Loader2, Search, CheckCircle2, XCircle } from 'lucide-react'
import { platformApi } from '@/lib/api'
import { formatSEK } from '@/lib/utils'
import { Badge } from '@/components/dashboard/Badge'

const STATUS_BADGE: Record<string, string> = {
  trialing: 'text-amber-600 bg-amber-50',
  active:   'text-teal-600 bg-teal-50',
  past_due: 'text-red-600 bg-red-50',
  canceled: 'text-neutral-500 bg-neutral-100',
}

export default function PlatformCompaniesPage() {
  const [companies, setCompanies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')

  useEffect(() => {
    (async () => {
      try {
        const res = await platformApi.companies()
        setCompanies(res.data ?? [])
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const filtered = companies.filter((c) =>
    `${c.name} ${c.slug} ${c.contactEmail}`.toLowerCase().includes(query.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-neutral-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-2xl text-neutral-900">Companies</h1>
          <p className="text-sm text-neutral-500 mt-1">{companies.length} tenant{companies.length === 1 ? '' : 's'} on the platform.</p>
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search companies..."
            className="pl-9 pr-3 py-2 text-sm border border-neutral-200 rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-brand-600"
          />
        </div>
      </div>

      <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-100 text-left text-xs text-neutral-500">
              <th className="px-4 py-3 font-medium">Company</th>
              <th className="px-4 py-3 font-medium">Plan</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Users</th>
              <th className="px-4 py-3 font-medium">Bookings</th>
              <th className="px-4 py-3 font-medium">Revenue</th>
              <th className="px-4 py-3 font-medium">Payments</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr
                key={c.id}
                onClick={() => (window.location.href = `/platform/companies/${c.id}`)}
                className="border-b border-neutral-50 last:border-0 hover:bg-neutral-50 cursor-pointer transition-colors"
              >
                <td className="px-4 py-3">
                  <Link href={`/platform/companies/${c.id}`} className="font-medium text-neutral-900 hover:underline">
                    {c.name}
                  </Link>
                  <p className="text-xs text-neutral-400">{c.slug} · {c.contactEmail}</p>
                </td>
                <td className="px-4 py-3 capitalize text-neutral-700">{c.subscriptionTier}</td>
                <td className="px-4 py-3">
                  <Badge className={STATUS_BADGE[c.subscriptionStatus] ?? 'text-neutral-500 bg-neutral-100'}>
                    {c.subscriptionStatus}
                  </Badge>
                  {!c.isActive && (
                    <Badge className="text-red-600 bg-red-50 ml-1.5">disabled</Badge>
                  )}
                </td>
                <td className="px-4 py-3 text-neutral-700">{c.userCount}</td>
                <td className="px-4 py-3 text-neutral-700">{c.bookingCount}</td>
                <td className="px-4 py-3 font-medium text-neutral-900">{formatSEK(c.revenue, true)}</td>
                <td className="px-4 py-3">
                  {c.stripeOnboarded ? (
                    <CheckCircle2 size={16} className="text-teal-600" />
                  ) : (
                    <XCircle size={16} className="text-neutral-300" />
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sm text-neutral-400">
                  No companies match "{query}".
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
