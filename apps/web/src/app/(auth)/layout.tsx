import Link from 'next/link'
import { Sparkles } from 'lucide-react'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-neutral-50 grid lg:grid-cols-2">

      {/* ── Left panel — branding ──────────────────────────────────────── */}
      <div className="hidden lg:flex flex-col justify-between bg-brand-600 p-12 text-white relative overflow-hidden">

        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-brand-500 opacity-40" />
          <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-teal-600 opacity-20" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-brand-500 opacity-20" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full border border-brand-500 opacity-20" />
        </div>

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
            <Sparkles size={18} className="text-white" />
          </div>
          <Link href="/" className="font-display text-xl text-white">
            Stockholm<span className="text-brand-200">Cleaning</span>
          </Link>
        </div>

        {/* Center quote */}
        <div className="relative space-y-6">
          <blockquote className="font-display text-3xl text-white leading-snug">
            "Skinande rent hem —<br />
            du betalar bara hälften<br />
            med RUT-avdrag."
          </blockquote>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-display text-lg">
              A
            </div>
            <div>
              <p className="text-sm font-medium text-white">Anna Lindqvist</p>
              <p className="text-xs text-brand-200">Östermalm, Stockholm</p>
            </div>
          </div>
          <div className="flex gap-1">
            {[...Array(5)].map((_, i) => (
              <svg key={i} className="w-4 h-4 fill-amber-400 text-amber-400" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
        </div>

        {/* Bottom stats */}
        <div className="relative grid grid-cols-3 gap-6 border-t border-brand-500 pt-8">
          {[
            { value: '2 000+', label: 'Nöjda kunder' },
            { value: '4.9/5',  label: 'Genomsnittligt betyg' },
            { value: '50%',    label: 'Besparing med RUT' },
          ].map(({ value, label }) => (
            <div key={label}>
              <p className="font-display text-2xl text-white">{value}</p>
              <p className="text-xs text-brand-200 mt-1">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right panel — form ─────────────────────────────────────────── */}
      <div className="flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-16">
        {/* Mobile logo */}
        <div className="flex lg:hidden items-center gap-2.5 mb-10">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
            <Sparkles size={16} />
          </div>
          <Link href="/" className="font-display text-lg text-neutral-900">
            Stockholm<span className="text-brand-600">Cleaning</span>
          </Link>
        </div>

        <div className="mx-auto w-full max-w-sm">
          {children}
        </div>
      </div>
    </div>
  )
}
