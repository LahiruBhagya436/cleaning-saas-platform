'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Shield, LayoutDashboard, Building2, LogOut, ArrowLeftRight } from 'lucide-react'
import { signOut } from 'next-auth/react'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/platform',           label: 'Overview',  icon: LayoutDashboard },
  { href: '/platform/companies', label: 'Companies',  icon: Building2       },
]

export function PlatformSidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex w-56 flex-col border-r border-neutral-800 bg-neutral-950 min-h-screen sticky top-0">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-neutral-800">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500 text-neutral-950">
          <Shield size={14} />
        </div>
        <Link href="/platform" className="font-display text-base text-white">
          Platform<span className="text-amber-400">HQ</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active =
            pathname === href ||
            (href !== '/platform' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                active
                  ? 'bg-amber-500/10 text-amber-400 font-medium'
                  : 'text-neutral-400 hover:bg-neutral-900 hover:text-neutral-100'
              )}
            >
              <Icon size={16} className={active ? 'text-amber-400' : 'text-neutral-500'} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Switch to a company view + logout */}
      <div className="px-3 py-4 border-t border-neutral-800 space-y-0.5">
        <Link
          href="/admin"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-neutral-400 hover:bg-neutral-900 hover:text-neutral-100 transition-colors"
        >
          <ArrowLeftRight size={16} className="text-neutral-500" />
          Company admin view
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-neutral-400 hover:bg-red-950 hover:text-red-400 transition-colors w-full"
        >
          <LogOut size={16} className="text-neutral-500" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
