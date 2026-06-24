'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Loader2 } from 'lucide-react'
import { PlatformSidebar } from '@/components/layout/PlatformSidebar'

export default function PlatformLayout({
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
      router.replace('/login?callbackUrl=/platform')
      return
    }
    if (role && role !== 'superadmin') {
      router.replace('/admin')
    }
  }, [status, role, router])

  if (status === 'loading' || role !== 'superadmin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950">
        <Loader2 size={24} className="animate-spin text-neutral-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-100 flex">
      <PlatformSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-neutral-200 bg-white flex items-center px-6 sticky top-0 z-10">
          <p className="text-sm font-medium text-neutral-700">
            Platform owner view — visible only to you
          </p>
        </header>
        <main className="flex-1 p-6 md:p-8">
          <div className="mx-auto max-w-6xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
