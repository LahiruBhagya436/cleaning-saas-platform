'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Sparkles, CalendarDays, FileText, MapPin, User, LogOut, ShieldCheck } from 'lucide-react'
import { signOut, useSession } from 'next-auth/react'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/dashboard',             label: 'Översikt',      icon: Sparkles     },
  { href: '/dashboard/bookings',    label: 'Bokningar',     icon: CalendarDays },
  { href: '/dashboard/invoices',    label: 'Fakturor',      icon: FileText     },
  { href: '/dashboard/properties',  label: 'Mina adresser', icon: MapPin       },
  { href: '/dashboard/profile',     label: 'Mitt konto',    icon: User         },
]

const ADMIN_ROLES = ['coordinator', 'admin', 'superadmin']

export function DashboardSidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const role = (session?.user as any)?.role
  const isAdmin = ADMIN_ROLES.includes(role)

  return (
    <aside className="hidden md:flex w-56 flex-col border-r border-neutral-200 bg-white min-h-screen sticky top-0">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-neutral-100">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600 text-white">
          <Sparkles size={14} />
        </div>
        <Link href="/" className="font-display text-base text-neutral-900">
          Stockholm<span className="text-brand-600">Co.</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active =
            pathname === href ||
            (href !== '/dashboard' && pathname.startsWith(href))
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

      {/* Admin link */}
      {isAdmin && (
        <div className="px-3 pb-1">
          <Link
            href="/admin"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-brand-700 bg-brand-50 hover:bg-brand-100 transition-colors font-medium"
          >
            <ShieldCheck size={16} className="text-brand-600" />
            Adminpanel
          </Link>
        </div>
      )}

      {/* Logout */}
      <div className="px-3 py-4 border-t border-neutral-100">
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
