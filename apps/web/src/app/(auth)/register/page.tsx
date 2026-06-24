'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, ArrowRight, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input, Label } from '@/components/ui/index'
import { authApi } from '@/lib/api'
import { toast } from 'sonner'

const schema = z
  .object({
    fullName:        z.string().min(2, 'Ange ditt fullständiga namn'),
    email:           z.string().email('Ange en giltig e-postadress'),
    phone:           z.string().min(8, 'Ange ett giltigt telefonnummer').optional().or(z.literal('')),
    password:        z.string().min(8, 'Lösenordet måste vara minst 8 tecken'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Lösenorden matchar inte',
    path:    ['confirmPassword'],
  })

type FormData = z.infer<typeof schema>

const PASSWORD_RULES = [
  { label: 'Minst 8 tecken',        test: (p: string) => p.length >= 8 },
  { label: 'Innehåller en siffra',  test: (p: string) => /\d/.test(p) },
  { label: 'Innehåller en bokstav', test: (p: string) => /[a-zA-Z]/.test(p) },
]

export default function RegisterPage() {
  const router = useRouter()
  const [showPassword, setShowPassword]        = useState(false)
  const [showConfirmPassword, setShowConfirm]  = useState(false)
  const [googleLoading, setGoogleLoading]      = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const password = watch('password', '')

  const onSubmit = async (data: FormData) => {
    try {
      await authApi.register({
        email:    data.email,
        password: data.password,
        fullName: data.fullName,
        phone:    data.phone || undefined,
      })

      // Auto-login after register
      const result = await signIn('credentials', {
        email:    data.email,
        password: data.password,
        redirect: false,
      })

      if (result?.error) {
        toast.error('Konto skapat men inloggning misslyckades. Försök logga in manuellt.')
        router.push('/login')
        return
      }

      toast.success('Välkommen! Ditt konto är skapat.')
      router.push('/dashboard')
      router.refresh()
    } catch (err: any) {
      const message = err?.message ?? 'Något gick fel. Försök igen.'
      if (message.includes('EMAIL_TAKEN') || message.includes('already registered')) {
        toast.error('E-postadressen är redan registrerad. Vill du logga in?')
      } else {
        toast.error(message)
      }
    }
  }

  const handleGoogle = async () => {
    setGoogleLoading(true)
    await signIn('google', { callbackUrl: '/dashboard' })
  }

  return (
    <div className="animate-fade-up">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-3xl text-neutral-900 mb-2">
          Skapa konto
        </h1>
        <p className="text-sm text-neutral-500">
          Redan kund?{' '}
          <Link href="/login" className="text-brand-600 font-medium hover:underline">
            Logga in här
          </Link>
        </p>
      </div>

      {/* Google button */}
      <Button
        variant="outline"
        className="w-full mb-5"
        onClick={handleGoogle}
        loading={googleLoading}
        type="button"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Registrera med Google
      </Button>

      {/* Divider */}
      <div className="relative mb-5">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-neutral-200" />
        </div>
        <div className="relative flex justify-center text-xs text-neutral-400">
          <span className="bg-neutral-50 px-3">eller med e-post</span>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">

        {/* Full name */}
        <div>
          <Label htmlFor="fullName">Fullständigt namn</Label>
          <Input
            id="fullName"
            placeholder="Anna Lindqvist"
            autoComplete="name"
            error={errors.fullName?.message}
            {...register('fullName')}
          />
          {errors.fullName && (
            <p className="mt-1.5 text-xs text-red-500">{errors.fullName.message}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <Label htmlFor="email">E-postadress</Label>
          <Input
            id="email"
            type="email"
            placeholder="din@email.se"
            autoComplete="email"
            error={errors.email?.message}
            {...register('email')}
          />
          {errors.email && (
            <p className="mt-1.5 text-xs text-red-500">{errors.email.message}</p>
          )}
        </div>

        {/* Phone (optional) */}
        <div>
          <Label htmlFor="phone">
            Telefonnummer{' '}
            <span className="text-neutral-400 font-normal">(valfritt)</span>
          </Label>
          <Input
            id="phone"
            type="tel"
            placeholder="+46701234567"
            autoComplete="tel"
            {...register('phone')}
          />
        </div>

        {/* Password */}
        <div>
          <Label htmlFor="password">Lösenord</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Minst 8 tecken"
              autoComplete="new-password"
              error={errors.password?.message}
              className="pr-10"
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {/* Password strength indicators */}
          {password.length > 0 && (
            <div className="mt-2 space-y-1">
              {PASSWORD_RULES.map(({ label, test }) => (
                <div key={label} className="flex items-center gap-2">
                  <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center transition-colors ${test(password) ? 'bg-teal-500' : 'bg-neutral-200'}`}>
                    {test(password) && <Check size={9} className="text-white" strokeWidth={3} />}
                  </div>
                  <span className={`text-xs transition-colors ${test(password) ? 'text-teal-600' : 'text-neutral-400'}`}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
          )}
          {errors.password && (
            <p className="mt-1.5 text-xs text-red-500">{errors.password.message}</p>
          )}
        </div>

        {/* Confirm password */}
        <div>
          <Label htmlFor="confirmPassword">Bekräfta lösenord</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Samma lösenord igen"
              autoComplete="new-password"
              error={errors.confirmPassword?.message}
              className="pr-10"
              {...register('confirmPassword')}
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
            >
              {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="mt-1.5 text-xs text-red-500">{errors.confirmPassword.message}</p>
          )}
        </div>

        {/* Terms */}
        <p className="text-xs text-neutral-400 leading-relaxed">
          Genom att registrera dig godkänner du våra{' '}
          <Link href="/terms" className="text-brand-600 hover:underline">
            användarvillkor
          </Link>{' '}
          och{' '}
          <Link href="/privacy" className="text-brand-600 hover:underline">
            integritetspolicy
          </Link>
          .
        </p>

        <Button
          type="submit"
          className="w-full group"
          size="lg"
          loading={isSubmitting}
        >
          Skapa konto
          <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
        </Button>
      </form>
    </div>
  )
}
