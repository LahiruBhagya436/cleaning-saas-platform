'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Loader2 } from 'lucide-react'
import { AdminSidebar } from '@/components/layout/AdminSidebar'
import { DashboardHeader } from '@/components/layout/DashboardHeader'

const ADMIN_ROLES = ['coordinator', 'admin', 'superadmin']

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const role = (session?.user as any)?.role

  useEffect(() => {
    if (status === 'loading') return
    if (status === 'unauthenticated') {
      router.replace('/login?callbackUrl=/admin')
      return
    }
    if (!ADMIN_ROLES.includes(role)) {
      router.replace('/dashboard')
    }
  }, [status, role, router])

  // Give the admin dashboard its own browser tab title so it reads as a
  // distinct, permanent space rather than an extension of the public site.
  useEffect(() => {
    document.title = 'Adminpanel | Stockholm Cleaning Co.'
  }, [])

  if (status === 'loading' || !role || !ADMIN_ROLES.includes(role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <Loader2 size={24} className="animate-spin text-neutral-400" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader />
        {role === 'superadmin' && (
          <div className="bg-amber-50 border-b border-amber-200 px-6 py-2.5 flex items-center justify-between gap-4">
            <p className="text-xs text-amber-700">
              Platform owner mode — admin data is empty because your account isn&#39;t scoped to a company.
            </p>
            <Link href="/platform" className="text-xs font-medium text-amber-800 hover:underline whitespace-nowrap">
              Platform HQ →
            </Link>
          </div>
        )}
        <main className="flex-1 p-6 md:p-8">
          <div className="mx-auto max-w-6xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
