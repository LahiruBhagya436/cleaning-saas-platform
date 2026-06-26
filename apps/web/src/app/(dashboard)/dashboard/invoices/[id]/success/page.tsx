'use client'

import { Suspense, useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle, Loader2, AlertCircle } from 'lucide-react'
import { invoicesApi } from '@/lib/api'
import { formatSEK } from '@/lib/utils'
import { Button } from '@/components/ui/button'

export default function InvoicePaymentSuccessPage() {
  return (
    <Suspense fallback={null}>
      <InvoicePaymentSuccessContent />
    </Suspense>
  )
}

function InvoicePaymentSuccessContent() {
  const params = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const router = useRouter()
  const [status, setStatus] = useState<'checking' | 'paid' | 'pending' | 'error'>('checking')
  const [invoice, setInvoice] = useState<any>(null)

  useEffect(() => {
    let attempts = 0
    let cancelled = false

    const fetchInvoice = async () => {
      const res = await invoicesApi.get(params.id)
      if (!cancelled) setInvoice(res.data)
      return res.data
    }

    const poll = async () => {
      try {
        const data = await fetchInvoice()
        if (cancelled) return

        if (data?.status === 'paid') {
          setStatus('paid')
          return
        }

        attempts += 1
        if (attempts < 6) {
          setTimeout(poll, 1500)
        } else {
          setStatus('pending')
        }
      } catch {
        if (!cancelled) setStatus('error')
      }
    }

    const run = async () => {
      // Reconcile directly with Stripe using the session_id Stripe redirected
      // back with — don't just wait on the webhook, which can lag or (in
      // local dev) not be configured at all.
      if (sessionId) {
        try {
          await invoicesApi.confirm(params.id, sessionId)
        } catch {
          // fall through to polling below regardless
        }
      }
      poll()
    }

    run()
    return () => { cancelled = true }
  }, [params.id, sessionId])

  return (
    <div className="max-w-md mx-auto py-16 text-center space-y-6">
      {status === 'checking' && (
        <>
          <Loader2 size={40} className="animate-spin text-brand-600 mx-auto" />
          <h1 className="font-display text-xl text-neutral-900">Bekräftar betalning...</h1>
          <p className="text-sm text-neutral-500">Det tar bara några sekunder.</p>
        </>
      )}

      {status === 'paid' && (
        <>
          <div className="w-16 h-16 rounded-full bg-teal-50 flex items-center justify-center mx-auto">
            <CheckCircle size={32} className="text-teal-600" />
          </div>
          <h1 className="font-display text-2xl text-neutral-900">Betalning genomförd!</h1>
          <p className="text-sm text-neutral-500">
            {invoice?.invoiceNumber} · {formatSEK(Number(invoice?.customerPays ?? 0))}
          </p>
          <Button onClick={() => router.push('/dashboard/invoices')}>
            Tillbaka till fakturor
          </Button>
        </>
      )}

      {status === 'pending' && (
        <>
          <Loader2 size={40} className="text-amber-500 mx-auto" />
          <h1 className="font-display text-xl text-neutral-900">Betalningen behandlas</h1>
          <p className="text-sm text-neutral-500">
            Vi har tagit emot din betalning från Stripe men väntar fortfarande på bekräftelse.
            Det kan ta en liten stund — kolla fakturasidan om en minut.
          </p>
          <Button variant="outline" onClick={() => router.push('/dashboard/invoices')}>
            Tillbaka till fakturor
          </Button>
        </>
      )}

      {status === 'error' && (
        <>
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto">
            <AlertCircle size={32} className="text-red-600" />
          </div>
          <h1 className="font-display text-xl text-neutral-900">Något gick fel</h1>
          <p className="text-sm text-neutral-500">
            Kunde inte hämta fakturastatus. Kontrollera dina fakturor eller försök igen.
          </p>
          <Button variant="outline" onClick={() => router.push('/dashboard/invoices')}>
            Tillbaka till fakturor
          </Button>
        </>
      )}
    </div>
  )
}
