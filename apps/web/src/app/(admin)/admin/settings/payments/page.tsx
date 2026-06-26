'use client'

import { Suspense, useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { CreditCard, ExternalLink, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { stripeConnectApi } from '@/lib/api'
import { toast } from 'sonner'

export default function PaymentsSettingsPage() {
  return (
    <Suspense fallback={null}>
      <PaymentsSettingsContent />
    </Suspense>
  )
}

function PaymentsSettingsContent() {
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [redirecting, setRedirecting] = useState(false)

  const loadStatus = useCallback(async () => {
    try {
      const res = await stripeConnectApi.status()
      setStatus(res.data)
    } catch (err: any) {
      toast.error(err?.message ?? 'Could not load payment status')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadStatus()
    if (searchParams.get('onboarded')) {
      toast.success('Stripe onboarding submitted — finalizing setup...')
    }
  }, [loadStatus, searchParams])

  const handleConnect = async () => {
    setRedirecting(true)
    try {
      const res = await stripeConnectApi.onboard()
      window.location.href = res.data.url
    } catch (err: any) {
      toast.error(err?.message ?? 'Could not start Stripe onboarding')
      setRedirecting(false)
    }
  }

  const handleDashboard = async () => {
    try {
      const res = await stripeConnectApi.dashboardLink()
      window.open(res.data.url, '_blank')
    } catch (err: any) {
      toast.error(err?.message ?? 'Could not open Stripe dashboard')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-neutral-400" />
      </div>
    )
  }

  const onboarded = status?.onboarded
  const connectedNotOnboarded = status?.connected && !onboarded

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="font-display text-2xl text-neutral-900">Payments</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Connect Stripe so customers can pay invoices directly into your account.
        </p>
      </div>

      <div className="bg-white border border-neutral-200 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
            onboarded ? 'bg-teal-50 text-teal-600' : 'bg-amber-50 text-amber-600'
          }`}>
            {onboarded ? <CheckCircle2 size={18} /> : <CreditCard size={18} />}
          </div>
          <div className="flex-1">
            <p className="font-medium text-neutral-900">
              {onboarded ? 'Payments are active' : connectedNotOnboarded ? 'Finish setting up Stripe' : 'Connect Stripe to get paid'}
            </p>
            <p className="text-sm text-neutral-500 mt-1 leading-relaxed">
              {onboarded
                ? 'Customers can pay invoices by card. Payouts go straight to your bank account.'
                : 'You need a connected Stripe account before customers can pay invoices online. It only takes a few minutes.'}
            </p>

            {status?.requirementsDue?.length > 0 && (
              <div className="mt-3 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
                <AlertTriangle size={14} className="text-amber-600 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-700">
                  Stripe needs more information: {status.requirementsDue.join(', ')}
                </p>
              </div>
            )}

            <div className="mt-4 flex gap-3">
              {!onboarded && (
                <Button onClick={handleConnect} loading={redirecting}>
                  {connectedNotOnboarded ? 'Continue setup' : 'Connect Stripe'}
                  <ExternalLink size={14} />
                </Button>
              )}
              {status?.connected && (
                <Button variant="outline" onClick={handleDashboard}>
                  Open Stripe dashboard
                  <ExternalLink size={14} />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-neutral-100 border border-neutral-200 rounded-xl p-4">
        <p className="text-xs text-neutral-500 leading-relaxed">
          A small platform fee is deducted automatically from each payment before it's transferred
          to your account — you don't need to do anything for this. Everything else (the rest of
          the payment) goes straight to you via Stripe payouts.
        </p>
      </div>
    </div>
  )
}
