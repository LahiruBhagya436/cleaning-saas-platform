'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { Sparkles, LayoutDashboard, CalendarDays, Users, LogOut, ReceiptText, ArrowLeftRight } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/admin',            label: 'Översikt',    icon: LayoutDashboard },
  { href: '/admin/bookings',   label: 'Bokningar',    icon: CalendarDays    },
  { href: '/admin/workers',    label: 'Personal',     icon: Users           },
  { href: '/admin/rut-claims', label: 'RUT-avdrag',   icon: ReceiptText     },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const role = (session?.user as any)?.role

  return (
    <aside className="hidden md:flex w-56 flex-col border-r border-neutral-200 bg-white min-h-screen sticky top-0">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-neutral-100">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600 text-white">
          <Sparkles size={14} />
        </div>
        <Link href="/admin" className="font-display text-base text-neutral-900">
          Admin<span className="text-brand-600">panel</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active =
            pathname === href ||
            (href !== '/admin' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                active
                  ? 'bg-brand-50 text-brand-700 font-medium'
                  : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
              )}
            >
              <Icon
                size={16}
                className={active ? 'text-brand-600' : 'text-neutral-400'}
              />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Back to customer view + logout */}
      <div className="px-3 py-4 border-t border-neutral-100 space-y-0.5">
        {role === 'superadmin' && (
          <Link
            href="/platform"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 transition-colors"
          >
            <ArrowLeftRight size={16} className="text-neutral-400" />
            Platform owner view
          </Link>
        )}
        <Link
          href="/dashboard"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 transition-colors"
        >
          <Sparkles size={16} className="text-neutral-400" />
          Kunddashboard
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-neutral-600 hover:bg-red-50 hover:text-red-600 transition-colors w-full"
        >
          <LogOut size={16} className="text-neutral-400" />
          Logga ut
        </button>
      </div>
    </aside>
  )
}
