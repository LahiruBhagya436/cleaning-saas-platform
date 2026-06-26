'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input, Label } from '@/components/ui/index'
import { authApi } from '@/lib/api'

const schema = z.object({
  email: z.string().email('Ange en giltig e-postadress'),
})
type FormData = z.infer<typeof schema>

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const [sentEmail, setSentEmail] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    try {
      await authApi.forgotPassword(data.email)
      setSentEmail(data.email)
      setSent(true)
    } catch {
      // Always show success — don't confirm if email exists
      setSentEmail(data.email)
      setSent(true)
    }
  }

  if (sent) {
    return (
      <div className="animate-fade-up text-center">
        <div className="w-14 h-14 rounded-full bg-teal-50 border border-teal-200 flex items-center justify-center mx-auto mb-6">
          <Mail size={24} className="text-teal-600" />
        </div>
        <h1 className="font-display text-3xl text-neutral-900 mb-3">
          Kolla din e-post
        </h1>
        <p className="text-sm text-neutral-500 mb-6 leading-relaxed">
          Vi har skickat en länk för att återställa lösenordet till{' '}
          <span className="font-medium text-neutral-700">{sentEmail}</span>.
          Länken är giltig i 1 timme.
        </p>
        <p className="text-xs text-neutral-400 mb-8">
          Hittade du inget e-post? Kolla din skräppostmapp.
        </p>
        <Button variant="outline" className="w-full" asChild>
          <Link href="/login">
            <ArrowLeft size={16} />
            Tillbaka till inloggning
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="animate-fade-up">
      <div className="mb-8">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-700 transition-colors mb-6"
        >
          <ArrowLeft size={14} />
          Tillbaka
        </Link>
        <h1 className="font-display text-3xl text-neutral-900 mb-2">
          Glömt lösenord?
        </h1>
        <p className="text-sm text-neutral-500">
          Ange din e-postadress så skickar vi en länk för att återställa ditt lösenord.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <div>
          <Label htmlFor="email">E-postadress</Label>
          <Input
            id="email"
            type="email"
            placeholder="din@email.se"
            autoComplete="email"
            autoFocus
            error={errors.email?.message}
            {...register('email')}
          />
          {errors.email && (
            <p className="mt-1.5 text-xs text-red-500">{errors.email.message}</p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full"
          size="lg"
          loading={isSubmitting}
        >
          Skicka återställningslänk
        </Button>
      </form>
    </div>
  )
}
