'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { format } from 'date-fns'
import { sv } from 'date-fns/locale'
import {
  FileText, Download, ExternalLink,
  Loader2, CheckCircle, Clock, AlertCircle, CreditCard
} from 'lucide-react'
import { toast } from 'sonner'
import { invoicesApi } from '@/lib/api'
import { formatSEK } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/dashboard/Badge'
import { EmptyState } from '@/components/dashboard/EmptyState'

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  draft:   { label: 'Utkast',    color: 'text-neutral-600 bg-neutral-100', icon: FileText      },
  sent:    { label: 'Skickad',   color: 'text-brand-600 bg-brand-50',      icon: Clock         },
  paid:    { label: 'Betald',    color: 'text-teal-600 bg-teal-50',        icon: CheckCircle   },
  overdue: { label: 'Förfallen', color: 'text-red-600 bg-red-50',          icon: AlertCircle   },
  void:    { label: 'Makulerad', color: 'text-neutral-400 bg-neutral-100', icon: FileText      },
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([])
  const [loading,  setLoading]  = useState(true)
  const [selected, setSelected] = useState<any>(null)
  const [payingId, setPayingId] = useState<string | null>(null)
  const searchParams = useSearchParams()

  useEffect(() => {
    invoicesApi.list()
      .then((res) => setInvoices(res.data ?? []))
      .catch(() => toast.error('Kunde inte hämta fakturor.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (searchParams.get('cancelled') === '1') {
      toast.info('Betalningen avbröts. Du kan försöka igen när du vill.')
    }
  }, [searchParams])

  const handlePay = async (invoiceId: string) => {
    setPayingId(invoiceId)
    try {
      const res = await invoicesApi.checkout(invoiceId)
      if (res.data?.url) {
        window.location.href = res.data.url
      } else {
        toast.error('Kunde inte starta betalningen.')
      }
    } catch (err: any) {
      toast.error(err?.message ?? 'Kunde inte starta betalningen.')
    } finally {
      setPayingId(null)
    }
  }

  const totalPaid = invoices
    .filter((i) => i.status === 'paid')
    .reduce((sum, i) => sum + Number(i.customerPays), 0)

  const totalRut = invoices
    .reduce((sum, i) => sum + Number(i.rutDeduction ?? 0), 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={24} className="animate-spin text-neutral-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="font-display text-2xl text-neutral-900">Mina fakturor</h1>
        <p className="text-sm text-neutral-500 mt-1">
          {invoices.length} fakturor totalt
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-neutral-200 rounded-xl p-5">
          <p className="text-xs text-neutral-500 mb-1">Totalt betalt</p>
          <p className="font-display text-2xl text-neutral-900">{formatSEK(totalPaid)}</p>
        </div>
        <div className="bg-teal-50 border border-teal-200 rounded-xl p-5">
          <p className="text-xs text-teal-600 mb-1">Totalt sparat (RUT)</p>
          <p className="font-display text-2xl text-teal-700">{formatSEK(totalRut)}</p>
        </div>
      </div>

      {/* Invoice list */}
      {invoices.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Inga fakturor ännu"
          description="Fakturor skapas automatiskt när en städning är slutförd."
          action={{ label: 'Boka städning', href: '/book' }}
        />
      ) : (
        <div className="space-y-3">
          {invoices.map((invoice) => {
            const cfg     = STATUS_CONFIG[invoice.status] ?? STATUS_CONFIG.sent
            const Icon    = cfg.icon
            const isOpen  = selected?.id === invoice.id

            return (
              <div
                key={invoice.id}
                className="bg-white border border-neutral-200 rounded-xl overflow-hidden"
              >
                {/* Row */}
                <button
                  onClick={() => setSelected(isOpen ? null : invoice)}
                  className="w-full flex items-center gap-4 p-5 text-left hover:bg-neutral-50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center shrink-0">
                    <Icon size={18} className="text-neutral-500" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-medium text-neutral-900 font-mono">
                        {invoice.invoiceNumber}
                      </span>
                      <Badge className={cfg.color}>{cfg.label}</Badge>
                    </div>
                    <p className="text-xs text-neutral-400">
                      Utfärdad {format(new Date(invoice.issuedAt), 'd MMM yyyy', { locale: sv })}
                      {' · '}
                      Förfaller {format(new Date(invoice.dueAt), 'd MMM yyyy', { locale: sv })}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="font-display text-lg text-brand-700">
                      {formatSEK(Number(invoice.customerPays))}
                    </p>
                    {Number(invoice.rutDeduction) > 0 && (
                      <p className="text-xs text-teal-600">
                        RUT −{formatSEK(Number(invoice.rutDeduction))}
                      </p>
                    )}
                  </div>
                </button>

                {/* Expanded detail */}
                {isOpen && (
                  <div className="border-t border-neutral-100 px-5 pb-5 pt-4 bg-neutral-50">
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-neutral-500">Arbetskostnad (ex. moms)</span>
                        <span>{formatSEK(Number(invoice.labourCost))}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-neutral-500">Moms (25%)</span>
                        <span>{formatSEK(Number(invoice.vatAmount))}</span>
                      </div>
                      {Number(invoice.rutDeduction) > 0 && (
                        <div className="flex justify-between text-sm text-teal-600">
                          <span>RUT-avdrag</span>
                          <span>−{formatSEK(Number(invoice.rutDeduction))}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm font-medium border-t border-neutral-200 pt-2">
                        <span>Du betalar</span>
                        <span className="text-brand-700">
                          {formatSEK(Number(invoice.customerPays))}
                        </span>
                      </div>
                    </div>

                    {/* RUT claim status */}
                    {invoice.rutClaim && (
                      <div className={`text-xs px-3 py-2 rounded-lg mb-3 ${
                        invoice.rutClaim.claimStatus === 'approved'
                          ? 'bg-teal-50 text-teal-700'
                          : invoice.rutClaim.claimStatus === 'rejected'
                          ? 'bg-red-50 text-red-600'
                          : 'bg-brand-50 text-brand-600'
                      }`}>
                        RUT-ansökan: {
                          invoice.rutClaim.claimStatus === 'approved' ? '✓ Godkänd av Skatteverket' :
                          invoice.rutClaim.claimStatus === 'rejected' ? '✗ Nekad av Skatteverket' :
                          invoice.rutClaim.claimStatus === 'submitted' ? '⏳ Inskickad till Skatteverket' :
                          '⏳ Väntar på inskickning'
                        }
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      {(invoice.status === 'sent' || invoice.status === 'overdue') && (
                        <Button
                          size="sm"
                          onClick={() => handlePay(invoice.id)}
                          disabled={payingId === invoice.id}
                        >
                          {payingId === invoice.id ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : (
                            <CreditCard size={13} />
                          )}
                          Betala nu
                        </Button>
                      )}
                      {invoice.pdfUrl ? (
                        <Button size="sm" variant="outline" asChild>
                          <a href={invoice.pdfUrl} target="_blank" rel="noopener noreferrer">
                            <Download size={13} />
                            Ladda ner PDF
                          </a>
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" disabled>
                          <Download size={13} />
                          PDF genereras...
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
