import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
      <div className="text-center max-w-md">
        <p className="font-display text-8xl text-brand-600 mb-6">404</p>
        <h1 className="font-display text-2xl text-neutral-900 mb-2">Sidan hittades inte</h1>
        <p className="text-sm text-neutral-500 mb-8">
          Den här sidan finns inte eller har flyttats.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors"
        >
          <ArrowLeft size={14} />
          Till startsidan
        </Link>
      </div>
    </div>
  )
}
