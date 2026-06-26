'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import { bookingsApi } from '@/lib/api'
import { Navbar } from '@/components/layout/Navbar'
import { BookingProgress } from '@/components/booking/BookingProgress'
import { StepService }     from '@/components/booking/StepService'
import { StepAddress }     from '@/components/booking/StepAddress'
import { StepDateTime }    from '@/components/booking/StepDateTime'
import { StepConfirm }     from '@/components/booking/StepConfirm'
import { BookingSuccess }  from '@/components/booking/BookingSuccess'

// ── Types ─────────────────────────────────────────────────────────────────────
export interface BookingData {
  // Step 1
  serviceId:       string
  serviceName:     string
  servicePriceSEK: number
  rutEligible:     boolean
  durationMinutes: number
  // Step 2
  propertyId:      string
  addressLine1:    string
  city:            string
  postalCode:      string
  notes:           string
  // Step 3
  scheduledAt:     string   // ISO string
  // Calculated
  totalExclVat:    number
  vatAmount:       number
  rutDeduction:    number
  customerPays:    number
}

const INITIAL: BookingData = {
  serviceId: '', serviceName: '', servicePriceSEK: 0,
  rutEligible: true, durationMinutes: 120,
  propertyId: '', addressLine1: '', city: 'Stockholm',
  postalCode: '', notes: '',
  scheduledAt: '',
  totalExclVat: 0, vatAmount: 0, rutDeduction: 0, customerPays: 0,
}

const STEPS = ['Tjänst', 'Adress', 'Datum & tid', 'Bekräfta']

export default function BookPage() {
  const router         = useRouter()
  const { data: session } = useSession()
  const [step, setStep]           = useState(0)
  const [data, setData]           = useState<BookingData>(INITIAL)
  const [booking, setBooking]     = useState<any>(null)
  const [submitting, setSubmitting] = useState(false)

  const update = (partial: Partial<BookingData>) =>
    setData((prev) => ({ ...prev, ...partial }))

  const next = () => setStep((s) => s + 1)
  const back = () => setStep((s) => s - 1)

  const submit = async () => {
    if (!session) {
      toast.error('Du måste logga in för att boka.')
      router.push('/login?callbackUrl=/book')
      return
    }
    setSubmitting(true)
    try {
      const result = await bookingsApi.create({
        propertyId:      data.propertyId,
        serviceIds:      [data.serviceId],
        scheduledAt:     data.scheduledAt,
        durationMinutes: data.durationMinutes,
        recurrence:      'none',
        notes:           data.notes || undefined,
      })
      setBooking(result.data)
      setStep(4) // success screen
    } catch (err: any) {
      toast.error(err?.message ?? 'Bokning misslyckades. Försök igen.')
    } finally {
      setSubmitting(false)
    }
  }

  // Success screen
  if (step === 4 && booking) {
    return <BookingSuccess booking={booking} />
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navbar />

      <div className="container-tight py-10">
        {/* Page title */}
        <div className="mb-8 text-center">
          <h1 className="font-display text-3xl text-neutral-900 mb-2">
            Boka städning
          </h1>
          <p className="text-neutral-500 text-sm">
            Klar på 3 enkla steg · RUT-avdrag beräknas automatiskt
          </p>
        </div>

        {/* Progress bar */}
        <BookingProgress steps={STEPS} current={step} />

        {/* Step content */}
        <div className="mt-8 max-w-2xl mx-auto">
          {step === 0 && (
            <StepService
              data={data}
              update={update}
              onNext={next}
            />
          )}
          {step === 1 && (
            <StepAddress
              data={data}
              update={update}
              onNext={next}
              onBack={back}
              session={session}
            />
          )}
          {step === 2 && (
            <StepDateTime
              data={data}
              update={update}
              onNext={next}
              onBack={back}
            />
          )}
          {step === 3 && (
            <StepConfirm
              data={data}
              onSubmit={submit}
              onBack={back}
              submitting={submitting}
              isLoggedIn={!!session}
            />
          )}
        </div>
      </div>
    </div>
  )
}
