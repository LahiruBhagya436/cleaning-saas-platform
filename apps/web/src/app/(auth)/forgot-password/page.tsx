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
  email: z.string().email('Enter a valid email address'),
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
          Check your email
        </h1>
        <p className="text-sm text-neutral-500 mb-6 leading-relaxed">
          We've sent a link to reset your password to{' '}
          <span className="font-medium text-neutral-700">{sentEmail}</span>.
          The link is valid for 1 hour.
        </p>
        <p className="text-xs text-neutral-400 mb-8">
          Didn't get the email? Check your spam folder.
        </p>
        <Button variant="outline" className="w-full" asChild>
          <Link href="/login">
            <ArrowLeft size={16} />
            Back to login
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
          Back
        </Link>
        <h1 className="font-display text-3xl text-neutral-900 mb-2">
          Forgot password?
        </h1>
        <p className="text-sm text-neutral-500">
          Enter your email and we'll send you a link to reset your password.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <div>
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@email.com"
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
          Send reset link
        </Button>
      </form>
    </div>
  )
}
