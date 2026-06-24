'use client'

import Link from 'next/link'
import { signOut, useSession } from 'next-auth/react'
import { Bell, Plus, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

export function DashboardHeader() {
  const { data: session } = useSession()
  const [menuOpen, setMenuOpen] = useState(false)

  const name     = session?.user?.name  ?? ''
  const email    = session?.user?.email ?? ''
  const initials = name
    ? name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
    : 'U'

  return (
    <header className="h-16 border-b border-neutral-200 bg-white flex items-center justify-between px-6 sticky top-0 z-10">
      <div className="flex items-center gap-4">
        <p className="text-sm font-medium text-neutral-700 hidden md:block">
          Välkommen tillbaka,{' '}
          <span className="text-neutral-900">
            {name.split(' ')[0] || 'kund'}
          </span>
        </p>
      </div>

      <div className="flex items-center gap-3">
        {/* Book new */}
        <Button size="sm" asChild>
          <Link href="/book">
            <Plus size={14} />
            Ny bokning
          </Link>
        </Button>

        {/* Notifications */}
        <button className="relative p-2 rounded-lg text-neutral-500 hover:bg-neutral-100 transition-colors">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-red-500" />
        </button>

        {/* User avatar + dropdown */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg hover:bg-neutral-100 transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-xs font-medium">
              {initials}
            </div>
            <ChevronDown size={14} className="text-neutral-400" />
          </button>

          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 top-full mt-1.5 w-48 bg-white rounded-xl border border-neutral-200 shadow-modal z-20 py-1.5">
                <div className="px-3 py-2 border-b border-neutral-100 mb-1">
                  <p className="text-sm font-medium text-neutral-900 truncate">
                    {name}
                  </p>
                  <p className="text-xs text-neutral-400 truncate">{email}</p>
                </div>
                <Link
                  href="/dashboard/profile"
                  className="flex items-center px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
                  onClick={() => setMenuOpen(false)}
                >
                  Inställningar
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  Logga ut
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
