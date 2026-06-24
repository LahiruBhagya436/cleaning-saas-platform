'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowRight, Check, X, Loader2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input, Label } from '@/components/ui/index'
import { authApi } from '@/lib/api'
import { toast } from 'sonner'

const PLATFORM_DOMAIN = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN ?? 'platform.se'

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // strip accents
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 63)
}

const schema = z.object({
  companyName:  z.string().min(2, 'Enter your company name').max(200),
  slug: z.string().min(2, 'Too short').max(63)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Lowercase letters, numbers and hyphens only'),
  contactEmail: z.string().email('Enter a valid email'),
  contactPhone: z.string().optional().or(z.literal('')),
  fullName:     z.string().min(2, 'Enter your full name').max(200),
  email:        z.string().email('Enter a valid email'),
  password:     z.string().min(8, 'Password must be at least 8 characters'),
  phone:        z.string().optional().or(z.literal('')),
})

type FormData = z.infer<typeof schema>

type SlugStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid'

export default function CompanySignupPage() {
  const router = useRouter()
  const [slugTouched, setSlugTouched] = useState(false)
  const [slugStatus, setSlugStatus] = useState<SlugStatus>('idle')

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const companyName = watch('companyName', '')
  const slug = watch('slug', '')

  // Auto-derive slug from company name until the user edits it manually
  useEffect(() => {
    if (!slugTouched) setValue('slug', slugify(companyName))
  }, [companyName, slugTouched, setValue])

  // Debounced live availability check
  useEffect(() => {
    if (!slug || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
      setSlugStatus(slug ? 'invalid' : 'idle')
      return
    }
    setSlugStatus('checking')
    const handle = setTimeout(async () => {
      try {
        const res = await authApi.checkSlug(slug)
        setSlugStatus(res.data.available ? 'available' : 'taken')
      } catch {
        setSlugStatus('idle')
      }
    }, 400)
    return () => clearTimeout(handle)
  }, [slug])

  const previewDomain = useMemo(
    () => `${slug || 'yourcompany'}.${PLATFORM_DOMAIN}`,
    [slug]
  )

  const onSubmit = async (data: FormData) => {
    if (slugStatus === 'taken' || slugStatus === 'invalid') {
      toast.error('Please choose a different subdomain')
      return
    }
    try {
      await authApi.registerCompany({
        companyName:  data.companyName,
        slug:         data.slug,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone || undefined,
        fullName:     data.fullName,
        email:        data.email,
        password:     data.password,
        phone:        data.phone || undefined,
      })

      const result = await signIn('credentials', {
        email:    data.email,
        password: data.password,
        redirect: false,
      })

      if (result?.error) {
        toast.success('Account created — please log in.')
        router.push('/login')
        return
      }

      toast.success(`Welcome to the platform, ${data.companyName}!`)
      router.push('/admin')
      router.refresh()
    } catch (err: any) {
      const message = err?.message ?? 'Something went wrong. Please try again.'
      if (message.includes('SLUG_TAKEN')) {
        toast.error('That subdomain is already taken')
      } else if (message.includes('EMAIL_TAKEN')) {
        toast.error('That email is already registered')
      } else {
        toast.error(message)
      }
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 grid lg:grid-cols-2">

      {/* ── Left panel — platform branding ─────────────────────────────── */}
      <div className="hidden lg:flex flex-col justify-between bg-neutral-900 p-12 text-white relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-brand-600 opacity-30" />
          <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-teal-600 opacity-20" />
        </div>

        <div className="relative flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
            <Sparkles size={18} className="text-white" />
          </div>
          <Link href="/" className="font-display text-xl text-white">
            CleanOps<span className="text-brand-300">Platform</span>
          </Link>
        </div>

        <div className="relative space-y-6">
          <h2 className="font-display text-3xl text-white leading-snug">
            Run your cleaning<br />company on its own<br />booking platform.
          </h2>
          <p className="text-sm text-neutral-300 leading-relaxed max-w-sm">
            Get your own branded booking site, staff scheduling, invoicing and
            online payments — live in minutes. No setup fees, 14-day free trial.
          </p>
        </div>

        <div className="relative grid grid-cols-3 gap-6 border-t border-white/10 pt-8">
          {[
            { value: '14 days', label: 'Free trial' },
            { value: '5 min',   label: 'Setup time' },
            { value: '0 kr',    label: 'Setup fee' },
          ].map(({ value, label }) => (
            <div key={label}>
              <p className="font-display text-2xl text-white">{value}</p>
              <p className="text-xs text-neutral-400 mt-1">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right panel — form ─────────────────────────────────────────── */}
      <div className="flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-16">
        <div className="flex lg:hidden items-center gap-2.5 mb-10">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-900 text-white">
            <Sparkles size={16} />
          </div>
          <Link href="/" className="font-display text-lg text-neutral-900">
            CleanOps<span className="text-brand-600">Platform</span>
          </Link>
        </div>

        <div className="mx-auto w-full max-w-md animate-fade-up">
          <div className="mb-8">
            <h1 className="font-display text-3xl text-neutral-900 mb-2">
              Set up your company
            </h1>
            <p className="text-sm text-neutral-500">
              Already on the platform?{' '}
              <Link href="/login" className="text-brand-600 font-medium hover:underline">
                Log in
              </Link>
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">

            {/* Company details */}
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Company</p>

              <div>
                <Label htmlFor="companyName">Company name</Label>
                <Input
                  id="companyName"
                  placeholder="Nordic Sparkle Cleaning AB"
                  error={errors.companyName?.message}
                  {...register('companyName')}
                />
                {errors.companyName && <p className="mt-1.5 text-xs text-red-500">{errors.companyName.message}</p>}
              </div>

              <div>
                <Label htmlFor="slug">Your booking site</Label>
                <div className="relative">
                  <Input
                    id="slug"
                    placeholder="nordic-sparkle"
                    error={errors.slug?.message}
                    className="pr-9"
                    {...register('slug', {
                      onChange: () => setSlugTouched(true),
                    })}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {slugStatus === 'checking' && <Loader2 size={16} className="animate-spin text-neutral-400" />}
                    {slugStatus === 'available' && <Check size={16} className="text-teal-500" />}
                    {(slugStatus === 'taken' || slugStatus === 'invalid') && <X size={16} className="text-red-500" />}
                  </div>
                </div>
                <p className={`mt-1.5 text-xs ${slugStatus === 'taken' ? 'text-red-500' : 'text-neutral-500'}`}>
                  {slugStatus === 'taken'
                    ? 'This subdomain is already taken'
                    : <>Your site will be at <span className="font-mono text-neutral-700">{previewDomain}</span></>}
                </p>
                {errors.slug && <p className="mt-1.5 text-xs text-red-500">{errors.slug.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="contactEmail">Contact email</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    placeholder="hello@company.se"
                    error={errors.contactEmail?.message}
                    {...register('contactEmail')}
                  />
                  {errors.contactEmail && <p className="mt-1.5 text-xs text-red-500">{errors.contactEmail.message}</p>}
                </div>
                <div>
                  <Label htmlFor="contactPhone">
                    Contact phone <span className="text-neutral-400 font-normal">(optional)</span>
                  </Label>
                  <Input
                    id="contactPhone"
                    type="tel"
                    placeholder="+46701234567"
                    {...register('contactPhone')}
                  />
                </div>
              </div>
            </div>

            <div className="h-px bg-neutral-200" />

            {/* Owner account */}
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Your admin account</p>

              <div>
                <Label htmlFor="fullName">Your full name</Label>
                <Input
                  id="fullName"
                  placeholder="Anna Lindqvist"
                  autoComplete="name"
                  error={errors.fullName?.message}
                  {...register('fullName')}
                />
                {errors.fullName && <p className="mt-1.5 text-xs text-red-500">{errors.fullName.message}</p>}
              </div>

              <div>
                <Label htmlFor="email">Your email (login)</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="anna@company.se"
                  autoComplete="email"
                  error={errors.email?.message}
                  {...register('email')}
                />
                {errors.email && <p className="mt-1.5 text-xs text-red-500">{errors.email.message}</p>}
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Minst 8 tecken"
                  autoComplete="new-password"
                  error={errors.password?.message}
                  {...register('password')}
                />
                {errors.password && <p className="mt-1.5 text-xs text-red-500">{errors.password.message}</p>}
              </div>
            </div>

            <p className="text-xs text-neutral-400 leading-relaxed">
              By creating an account you agree to our{' '}
              <Link href="/terms" className="text-brand-600 hover:underline">terms</Link> and{' '}
              <Link href="/privacy" className="text-brand-600 hover:underline">privacy policy</Link>.
            </p>

            <Button type="submit" className="w-full group" size="lg" loading={isSubmitting}>
              Start free trial
              <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
