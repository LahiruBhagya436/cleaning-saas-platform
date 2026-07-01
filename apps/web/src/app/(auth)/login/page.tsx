'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn, getSession } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input, Label } from '@/components/ui/index'
import { toast } from 'sonner'

const schema = z.object({
  email:    z.string().email('Ange en giltig e-postadress'),
  password: z.string().min(1, 'Lösenord krävs'),
})
type FormData = z.infer<typeof schema>

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  )
}

function LoginForm() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const explicitCallbackUrl = searchParams.get('callbackUrl')
  const callbackUrl  = explicitCallbackUrl ?? '/dashboard'
  const urlError     = searchParams.get('error')

  const [showPassword, setShowPassword] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  // Pre-warm the Render API (free tier spins down after 15 min idle).
  // Firing a health-check request the moment the login page loads gives
  // Render ~30 s to wake up before the user actually submits credentials,
  // dramatically reducing "ServerUnavailable" errors on first login.
  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/v1'
    const healthUrl = apiUrl.replace(/\/v1\/?$/, '/health')
    fetch(healthUrl, { method: 'GET' }).catch(() => {})
  }, [])

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  // ── Email/password login ────────────────────────────────────────────────
  const onSubmit = async (data: FormData) => {
    const result = await signIn('credentials', {
      email:    data.email,
      password: data.password,
      redirect: false,
    })

    if (result?.error) {
      if (result.error === 'ServerUnavailable') {
        toast.error('Servern startar om — vänta några sekunder och försök igen.')
      } else {
        toast.error('Fel e-post eller lösenord. Försök igen.')
      }
      return
    }

    toast.success('Inloggad!')

    // No explicit callbackUrl (i.e. user landed on /login directly, not bounced
    // here from a role-gated page) — route by role so superadmins/company
    // admins don't have to manually navigate off the customer dashboard.
    if (!explicitCallbackUrl) {
      const session = await getSession()
      const role = (session?.user as any)?.role
      if (role === 'superadmin') {
        router.push('/platform')
      } else if (role === 'admin' || role === 'coordinator') {
        router.push('/admin')
      } else {
        router.push(callbackUrl)
      }
    } else {
      router.push(callbackUrl)
    }
    router.refresh()
  }

  // ── Google login ────────────────────────────────────────────────────────
  const handleGoogle = async () => {
    setGoogleLoading(true)
    await signIn('google', { callbackUrl })
  }

  return (
    <div className="animate-fade-up">
      {/* URL-error banners (NextAuth redirects here with ?error=) */}
      {urlError === 'OAuthBackendLinkError' && (
        <div className="mb-5 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
          <strong>Servern startar om.</strong> Vänta 30 sekunder och försök logga in med Google igen.
        </div>
      )}
      {urlError && urlError !== 'OAuthBackendLinkError' && (
        <div className="mb-5 rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
          Inloggning misslyckades — försök igen eller logga in med e-post.
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-3xl text-neutral-900 mb-2">
          Välkommen tillbaka
        </h1>
        <p className="text-sm text-neutral-500">
          Inget konto?{' '}
          <Link href="/register" className="text-brand-600 font-medium hover:underline">
            Skapa konto gratis
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
        Fortsätt med Google
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

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <Label htmlFor="password" className="mb-0">Lösenord</Label>
            <Link
              href="/forgot-password"
              className="text-xs text-brand-600 hover:underline"
            >
              Glömt lösenord?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              autoComplete="current-password"
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
          {errors.password && (
            <p className="mt-1.5 text-xs text-red-500">{errors.password.message}</p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full group"
          size="lg"
          loading={isSubmitting}
        >
          Logga in
          <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
        </Button>
      </form>

      {/* Demo credentials hint */}
      <div className="mt-6 rounded-lg bg-brand-50 border border-brand-100 p-3">
        <p className="text-xs font-medium text-brand-700 mb-1.5">Demo-konton</p>
        <div className="space-y-1 text-xs text-brand-600">
          <p>👤 Kund: anna@example.se / Customer123!</p>
          <p>🔧 Admin: admin@cleaningco.se / Admin123!</p>
        </div>
      </div>
    </div>
  )
}
