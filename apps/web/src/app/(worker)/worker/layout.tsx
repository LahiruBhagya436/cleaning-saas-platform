'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { Loader2, LogOut, Sparkles } from 'lucide-react'

const ALLOWED = ['staff', 'coordinator', 'admin', 'superadmin']

export default function WorkerLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const role = (session?.user as any)?.role
  const name = (session?.user as any)?.name ?? ''

  useEffect(() => {
    if (status === 'loading') return
    if (status === 'unauthenticated') { router.replace('/login?callbackUrl=/worker'); return }
    if (!ALLOWED.includes(role)) router.replace('/dashboard')
  }, [status, role, router])

  useEffect(() => { document.title = 'Min sida | Stockholm Cleaning Co.' }, [])

  if (status === 'loading' || !role || !ALLOWED.includes(role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <Loader2 size={24} className="animate-spin text-neutral-400" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-40">
        <div className="mx-auto max-w-4xl px-4 h-14 flex items-center gap-3">
          <span className="w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center">
            <Sparkles size={16} />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-neutral-900 leading-tight">Min sida</p>
            <p className="text-[11px] text-neutral-400 leading-tight truncate">
              {name}{role === 'coordinator' ? ' · Arbetsledare' : role === 'staff' ? ' · Städare' : ''}
            </p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="flex items-center gap-1.5 text-xs font-medium text-neutral-500 hover:text-red-600 px-2.5 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
          >
            <LogOut size={14} /> Logga ut
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-6">{children}</main>
    </div>
  )
}
