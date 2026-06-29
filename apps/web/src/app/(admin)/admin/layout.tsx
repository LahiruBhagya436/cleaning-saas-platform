'use client'

import { useEffect } from 'react'
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
        <main className="flex-1 p-6 md:p-8">
          <div className="mx-auto max-w-6xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
