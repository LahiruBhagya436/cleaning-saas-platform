'use client'

import { useEffect, useState } from 'react'
import { Loader2, Download, AlertTriangle, CheckCircle2, XCircle, Send } from 'lucide-react'
import { toast } from 'sonner'
import { rutClaimsApi, MissingPersonnummerInvoice, RutClaim } from '@/lib/api'
import { formatSEK } from '@/lib/utils'
import { Badge } from '@/components/dashboard/Badge'
import { Button } from '@/components/ui/button'

const STATUS_BADGE: Record<string, string> = {
  pending:   'bg-neutral-100 text-neutral-600',
  submitted: 'bg-blue-50 text-blue-600',
  approved:  'bg-emerald-50 text-emerald-600',
  rejected:  'bg-red-50 text-red-600',
}

const STATUS_LABEL: Record<string, string> = {
  pending:   'Väntar',
  submitted: 'Inskickad',
  approved:  'Godkänd',
  rejected:  'Avslagen',
}

const FILTERS = [
  { key: 'all',       label: 'Alla' },
  { key: 'pending',   label: 'Väntar' },
  { key: 'submitted', label: 'Inskickade' },
  { key: 'approved',  label: 'Godkända' },
  { key: 'rejected',  label: 'Avslagna' },
]

export default function RutClaimsPage() {
  const [claims, setClaims] = useState<RutClaim[]>([])
  const [missing, setMissing] = useState<MissingPersonnummerInvoice[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [refInputs, setRefInputs] = useState<Record<string, string>>({})

  const load = async () => {
    setLoading(true)
    try {
      const res = await rutClaimsApi.list()
      setClaims(res.data.claims)
      setMissing(res.data.missingPersonnummer)
    } catch {
      toast.error('Kunde inte hämta RUT-anspråk.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const setStatus = async (id: string, claimStatus: string) => {
    setBusyId(id)
    try {
      const skatteverketRef = refInputs[id]?.trim()
      const updated = await rutClaimsApi.update(id, {
        claimStatus,
        ...(claimStatus === 'submitted' && skatteverketRef ? { skatteverketRef } : {}),
      })
      setClaims((prev) => prev.map((c) => (c.id === id ? { ...c, ...updated.data } : c)))
      toast.success('Status uppdaterad.')
    } catch (err: any) {
      toast.error(err?.message ?? 'Kunde inte uppdatera status.')
    } finally {
      setBusyId(null)
    }
  }

  const downloadCsv = async () => {
    try {
      const blob = await rutClaimsApi.exportCsv()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'rut-claims.csv'
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch {
      toast.error('Kunde inte exportera CSV.')
    }
  }

  const filtered = filter === 'all' ? claims : claims.filter((c) => c.claimStatus === filter)
  const totalPending = claims.filter((c) => c.claimStatus === 'pending').reduce((sum, c) => sum + c.claimAmount, 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-neutral-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl text-neutral-900">RUT-avdrag</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Spåra och hantera anspråk om RUT-återbetalning från Skatteverket.
          </p>
        </div>
        <Button variant="outline" onClick={downloadCsv}>
          <Download size={14} />
          Exportera CSV (väntande)
        </Button>
      </div>

      {/* Summary */}
      <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
        <p className="text-sm font-medium text-amber-800">
          {formatSEK(totalPending)} väntar på att skickas in till Skatteverket
        </p>
        <p className="text-xs text-amber-700 mt-0.5">
          Exportera CSV-filen ovan och skicka in manuellt, sedan markera anspråken som "Inskickad" här.
        </p>
      </div>

      {/* Missing personnummer follow-ups */}
      {missing.length > 0 && (
        <div className="bg-white border border-neutral-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={16} className="text-amber-500" />
            <h2 className="font-medium text-neutral-900">
              Saknar personnummer ({missing.length})
            </h2>
          </div>
          <p className="text-sm text-neutral-500 mb-4">
            Dessa fakturor har RUT-avdrag men inget anspråk kunde skapas eftersom kunden inte har angett personnummer ännu. Be dem fylla i det på sin profilsida.
          </p>
          <div className="space-y-2">
            {missing.map((m) => (
              <div key={m.invoiceId} className="flex items-center justify-between py-2 border-b border-neutral-100 last:border-0 text-sm">
                <div>
                  <p className="font-medium text-neutral-900">{m.customerName}</p>
                  <p className="text-xs text-neutral-400">{m.customerEmail} · Faktura {m.invoiceNumber}</p>
                </div>
                <span className="text-neutral-600">{formatSEK(m.rutDeduction)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === key
                ? 'bg-neutral-900 text-white'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Claims table */}
      <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
        {filtered.length === 0 ? (
          <p className="text-sm text-neutral-400 text-center py-10">Inga anspråk i den här kategorin.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-neutral-500 text-xs">
              <tr>
                <th className="text-left font-medium px-4 py-3">Kund</th>
                <th className="text-left font-medium px-4 py-3">Personnummer</th>
                <th className="text-left font-medium px-4 py-3">Faktura</th>
                <th className="text-right font-medium px-4 py-3">Belopp</th>
                <th className="text-left font-medium px-4 py-3">Status</th>
                <th className="text-left font-medium px-4 py-3">Skatteverket-ref</th>
                <th className="text-right font-medium px-4 py-3">Åtgärder</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-t border-neutral-100">
                  <td className="px-4 py-3">
                    <p className="font-medium text-neutral-900">{c.customerName}</p>
                    <p className="text-xs text-neutral-400">{c.customerEmail}</p>
                  </td>
                  <td className="px-4 py-3 text-neutral-600 font-mono text-xs">{c.maskedPersonnummer}</td>
                  <td className="px-4 py-3 text-neutral-600">{c.invoiceNumber}</td>
                  <td className="px-4 py-3 text-right font-medium text-neutral-900">{formatSEK(c.claimAmount)}</td>
                  <td className="px-4 py-3">
                    <Badge className={STATUS_BADGE[c.claimStatus]}>{STATUS_LABEL[c.claimStatus]}</Badge>
                    {c.claimStatus === 'rejected' && c.rejectionReason && (
                      <p className="text-xs text-red-500 mt-1">{c.rejectionReason}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {c.claimStatus === 'pending' ? (
                      <input
                        type="text"
                        placeholder="Ref-nr"
                        value={refInputs[c.id] ?? ''}
                        onChange={(e) => setRefInputs((prev) => ({ ...prev, [c.id]: e.target.value }))}
                        className="w-28 text-xs border border-neutral-200 rounded-md px-2 py-1"
                      />
                    ) : (
                      <span className="text-xs text-neutral-500">{c.skatteverketRef ?? '—'}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1.5">
                      {c.claimStatus === 'pending' && (
                        <button
                          disabled={busyId === c.id}
                          onClick={() => setStatus(c.id, 'submitted')}
                          className="p-1.5 rounded-md text-blue-600 hover:bg-blue-50 disabled:opacity-40"
                          title="Markera som inskickad"
                        >
                          <Send size={14} />
                        </button>
                      )}
                      {c.claimStatus === 'submitted' && (
                        <>
                          <button
                            disabled={busyId === c.id}
                            onClick={() => setStatus(c.id, 'approved')}
                            className="p-1.5 rounded-md text-emerald-600 hover:bg-emerald-50 disabled:opacity-40"
                            title="Markera som godkänd"
                          >
                            <CheckCircle2 size={14} />
                          </button>
                          <button
                            disabled={busyId === c.id}
                            onClick={() => setStatus(c.id, 'rejected')}
                            className="p-1.5 rounded-md text-red-600 hover:bg-red-50 disabled:opacity-40"
                            title="Markera som avslagen"
                          >
                            <XCircle size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
