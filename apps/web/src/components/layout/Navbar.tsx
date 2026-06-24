'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { useState } from 'react'
import { Menu, X, Sparkles, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function Navbar() {
  const { data: session } = useSession()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-neutral-200/80 bg-white/90 backdrop-blur-md">
      <nav className="container-wide flex h-16 items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white shadow-sm group-hover:bg-brand-700 transition-colors">
            <Sparkles size={16} />
          </div>
          <span className="font-display text-lg text-neutral-900">
            Stockholm<span className="text-brand-600">Cleaning</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6">
          <Link href="/services" className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors">
            Tjänster
          </Link>
          <Link href="/pricing" className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors">
            Priser
          </Link>
          <Link href="/about" className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors">
            Om oss
          </Link>
          <div className="flex items-center gap-2 text-xs font-medium text-teal-600 bg-teal-50 px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
            RUT-avdrag — 50% rabatt
          </div>
        </div>

        {/* Desktop actions */}
        <div className="hidden md:flex items-center gap-3">
          {session ? (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard">Mina bokningar</Link>
              </Button>
              <Button variant="outline" size="sm" onClick={() => signOut()}>
                Logga ut
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">Logga in</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/book">Boka städning</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 rounded-lg text-neutral-600 hover:bg-neutral-100 transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-neutral-100 bg-white px-4 py-4 flex flex-col gap-3">
          <Link href="/services" className="text-sm text-neutral-700 py-2" onClick={() => setMobileOpen(false)}>Tjänster</Link>
          <Link href="/pricing"  className="text-sm text-neutral-700 py-2" onClick={() => setMobileOpen(false)}>Priser</Link>
          <Link href="/about"    className="text-sm text-neutral-700 py-2" onClick={() => setMobileOpen(false)}>Om oss</Link>
          <div className="border-t border-neutral-100 pt-3 flex flex-col gap-2">
            {session ? (
              <>
                <Button variant="outline" size="sm" asChild className="w-full">
                  <Link href="/dashboard" onClick={() => setMobileOpen(false)}>Mina bokningar</Link>
                </Button>
                <Button variant="ghost" size="sm" className="w-full" onClick={() => signOut()}>Logga ut</Button>
              </>
            ) : (
              <>
                <Button variant="outline" size="sm" asChild className="w-full">
                  <Link href="/login" onClick={() => setMobileOpen(false)}>Logga in</Link>
                </Button>
                <Button size="sm" asChild className="w-full">
                  <Link href="/book" onClick={() => setMobileOpen(false)}>Boka städning</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
