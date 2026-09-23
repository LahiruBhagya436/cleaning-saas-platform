'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { User, Lock, Bell, Check, Eye, EyeOff, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { authApi, usersApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input, Label } from '@/components/ui/index'

// ── Schemas ───────────────────────────────────────────────────────────────────

const profileSchema = z.object({
  fullName: z.string().min(2, 'Ange ditt namn'),
  phone:    z.string().optional(),
  personnummer: z
    .string()
    .optional()
    .refine((v) => !v || /^\d{6,8}[-+]?\d{4}$/.test(v.replace(/\s/g, '')), {
      message: 'Format: YYMMDD-XXXX or YYYYMMDD-XXXX',
    }),
})

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Enter current password'),
  newPassword:     z.string().min(8, 'Minst 8 tecken'),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

type ProfileForm   = z.infer<typeof profileSchema>
type PasswordForm  = z.infer<typeof passwordSchema>

const TABS = [
  { key: 'profile',  label: 'Account',       icon: User },
  { key: 'password', label: 'Password',    icon: Lock },
  { key: 'notifs',   label: 'Notifications',     icon: Bell },
] as const
type Tab = typeof TABS[number]['key']

export default function ProfilePage() {
  const { data: session, update } = useSession()
  const [tab, setTab] = useState<Tab>('profile')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew,     setShowNew]     = useState(false)
  const [hasPersonnummer, setHasPersonnummer] = useState(false)

  // ── Profile form ────────────────────────────────────────────────────────────
  const {
    register: regP,
    handleSubmit: handleP,
    reset: resetP,
    formState: { errors: errP, isSubmitting: submittingP },
  } = useForm<ProfileForm>({ resolver: zodResolver(profileSchema) })

  useEffect(() => {
    if (session?.user) {
      resetP({
        fullName: session.user.name ?? '',
        phone:    (session.user as any).phone ?? '',
        personnummer: '',
      })
    }
    // Pull the real backend record so we know whether a personnummer is
    // already on file (we never get the plaintext value back — only a flag).
    usersApi.me()
      .then((res) => setHasPersonnummer(res.data.hasPersonnummer))
      .catch((err) => console.error('Failed to load user profile:', err))
  }, [session])

  const onProfileSave = async (data: ProfileForm) => {
    try {
      const res = await usersApi.update({
        fullName: data.fullName,
        phone: data.phone,
        ...(data.personnummer ? { personnummer: data.personnummer } : {}),
      })
      setHasPersonnummer(res.data.hasPersonnummer)
      await update({ name: data.fullName })
      resetP({ ...data, personnummer: '' })
      toast.success('Profil uppdaterad.')
    } catch (err: any) {
      toast.error(err?.message ?? 'Kunde inte spara profilen.')
    }
  }

  // ── Password form ────────────────────────────────────────────────────────────
  const {
    register: regPw,
    handleSubmit: handlePw,
    reset: resetPw,
    formState: { errors: errPw, isSubmitting: submittingPw },
  } = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) })

  const onPasswordSave = async (data: PasswordForm) => {
    try {
      await authApi.changePassword(data.currentPassword, data.newPassword)
      toast.success('Password updated.')
      resetPw()
    } catch (err: any) {
      toast.error(err?.message ?? 'Could not update the password.')
    }
  }

  const user = session?.user

  return (
    <div className="space-y-6 max-w-2xl">

      {/* Header */}
      <div>
        <h1 className="font-display text-2xl text-neutral-900">Mitt konto</h1>
        <p className="text-sm text-neutral-500 mt-1">Hantera din profilinformation och inloggning.</p>
      </div>

      {/* Avatar row */}
      <div className="bg-white border border-neutral-200 rounded-xl p-5 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-brand-600 flex items-center justify-center text-white font-display text-xl shrink-0">
          {user?.name?.[0]?.toUpperCase() ?? '?'}
        </div>
        <div>
          <p className="font-medium text-neutral-900">{user?.name}</p>
          <p className="text-sm text-neutral-500">{user?.email}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-neutral-100 p-1 rounded-xl w-fit">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === key
                ? 'bg-white text-neutral-900 shadow-sm'
                : 'text-neutral-500 hover:text-neutral-700'
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab: Profile */}
      {tab === 'profile' && (
        <div className="bg-white border border-neutral-200 rounded-xl p-6">
          <h2 className="font-medium text-neutral-900 mb-5">Personuppgifter</h2>
          <form onSubmit={handleP(onProfileSave)} className="space-y-4">
            <div>
              <Label htmlFor="fullName">Full name</Label>
              <Input
                id="fullName"
                placeholder="Anna Andersson"
                error={errP.fullName?.message}
                {...regP('fullName')}
              />
              {errP.fullName && (
                <p className="mt-1 text-xs text-red-500">{errP.fullName.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="email">E-postadress</Label>
              <Input
                id="email"
                value={user?.email ?? ''}
                disabled
                className="bg-neutral-50 text-neutral-400 cursor-not-allowed"
              />
              <p className="mt-1 text-xs text-neutral-400">
                The email address cannot be changed. Contact support if needed.
              </p>
            </div>

            <div>
              <Label htmlFor="phone">
                Telefonnummer{' '}
                <span className="text-neutral-400 font-normal">(valfritt)</span>
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+46 70 123 45 67"
                {...regP('phone')}
              />
            </div>

            <div>
              <Label htmlFor="personnummer">
                Personal ID{' '}
                <span className="text-neutral-400 font-normal">(required for RUT deduction)</span>
              </Label>
              <Input
                id="personnummer"
                placeholder="YYYYMMDD-XXXX"
                error={errP.personnummer?.message}
                {...regP('personnummer')}
              />
              {errP.personnummer ? (
                <p className="mt-1 text-xs text-red-500">{errP.personnummer.message}</p>
              ) : hasPersonnummer ? (
                <p className="mt-1.5 flex items-center gap-1 text-xs text-emerald-600">
                  <ShieldCheck size={12} /> Personal ID registered and encrypted. Leave the field blank if you don't want to change it.
                </p>
              ) : (
                <p className="mt-1.5 text-xs text-neutral-400">
                  We need this so your cleaning company can claim the RUT deduction from Skatteverket on your behalf. It is encrypted before saving.
                </p>
              )}
            </div>

            <div className="pt-2">
              <Button type="submit" loading={submittingP}>
                <Check size={14} />
                Save changes
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Tab: Password */}
      {tab === 'password' && (
        <div className="bg-white border border-neutral-200 rounded-xl p-6">
          <h2 className="font-medium text-neutral-900 mb-1">Change password</h2>
          <p className="text-sm text-neutral-500 mb-5">
            Use at least 8 characters. We recommend a mix of letters, numbers and symbols.
          </p>
          <form onSubmit={handlePw(onPasswordSave)} className="space-y-4">
            <div>
              <Label htmlFor="currentPassword">Current password</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrent ? 'text' : 'password'}
                  placeholder="••••••••"
                  error={errPw.currentPassword?.message}
                  {...regPw('currentPassword')}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                >
                  {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errPw.currentPassword && (
                <p className="mt-1 text-xs text-red-500">{errPw.currentPassword.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="newPassword">New password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNew ? 'text' : 'password'}
                  placeholder="••••••••"
                  error={errPw.newPassword?.message}
                  {...regPw('newPassword')}
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                >
                  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errPw.newPassword && (
                <p className="mt-1 text-xs text-red-500">{errPw.newPassword.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirm new password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                error={errPw.confirmPassword?.message}
                {...regPw('confirmPassword')}
              />
              {errPw.confirmPassword && (
                <p className="mt-1 text-xs text-red-500">{errPw.confirmPassword.message}</p>
              )}
            </div>

            <div className="pt-2">
              <Button type="submit" loading={submittingPw}>
                <Lock size={14} />
                Update password
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Tab: Notifications */}
      {tab === 'notifs' && (
        <div className="bg-white border border-neutral-200 rounded-xl p-6">
          <h2 className="font-medium text-neutral-900 mb-1">Notification settings</h2>
          <p className="text-sm text-neutral-500 mb-6">
            Choose how you want to be notified about bookings and invoices.
          </p>

          <div className="space-y-4">
            {[
              {
                label: 'Booking confirmation',
                desc:  'Get a confirmation when your booking is approved.',
                defaultOn: true,
              },
              {
                label: 'Reminder before cleaning',
                desc:  'Reminder 24 hours and 2 hours before the booked time.',
                defaultOn: true,
              },
              {
                label: 'Invoice sent',
                desc:  'Notification when a new invoice is available.',
                defaultOn: true,
              },
              {
                label: 'Offers and news',
                desc:  'Promotions and news from Stockholm Cleaning Co.',
                defaultOn: false,
              },
            ].map(({ label, desc, defaultOn }) => (
              <div key={label} className="flex items-start justify-between gap-4 py-3 border-b border-neutral-100 last:border-0">
                <div>
                  <p className="text-sm font-medium text-neutral-900">{label}</p>
                  <p className="text-xs text-neutral-400 mt-0.5">{desc}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    defaultChecked={defaultOn}
                    className="sr-only peer"
                    onChange={() => toast.success('Setting saved.')}
                  />
                  <div className="w-9 h-5 bg-neutral-200 peer-focus:ring-2 peer-focus:ring-brand-300 rounded-full peer peer-checked:bg-brand-600 transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
                </label>
              </div>
            ))}
          </div>

          <div className="mt-6">
            <Button onClick={() => toast.success('Settings saved.')}>
              <Check size={14} />
              Save settings
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
