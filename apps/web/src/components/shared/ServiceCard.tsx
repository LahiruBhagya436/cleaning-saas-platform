import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { formatSEK } from '@/lib/utils'

interface Service {
  name:        string
  nameSv:      string
  price:       number
  rutEligible: boolean
  minHours:    number
  icon:        string
  popular:     boolean
}

export function ServiceCard({ service }: { service: Service }) {
  const totalPerHour   = service.price * 1.25
  const afterRut       = service.rutEligible ? totalPerHour * 0.5 : totalPerHour

  return (
    <div className={`relative group bg-white rounded-xl border p-5 shadow-card card-hover transition-all duration-200 ${service.popular ? 'border-brand-200 ring-1 ring-brand-100' : 'border-neutral-200'}`}>
      {service.popular && (
        <div className="absolute -top-2.5 left-4 bg-brand-600 text-white text-2xs font-medium px-2.5 py-0.5 rounded-full">
          Populärast
        </div>
      )}

      <div className="flex items-start justify-between mb-3">
        <div className="text-2xl">{service.icon}</div>
        {service.rutEligible && (
          <span className="text-2xs font-medium text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">
            RUT
          </span>
        )}
      </div>

      <h3 className="font-sans font-medium text-neutral-900 mb-1">{service.name}</h3>
      <p className="text-xs text-neutral-400 mb-4">{service.nameSv}</p>

      <div className="flex items-end justify-between">
        <div>
          {service.rutEligible ? (
            <>
              <p className="text-xs text-neutral-400 line-through">{formatSEK(totalPerHour)}/tim</p>
              <p className="font-display text-xl text-teal-600">
                {formatSEK(afterRut)}<span className="text-sm font-sans text-neutral-400">/tim</span>
              </p>
              <p className="text-xs text-neutral-400">med RUT-avdrag</p>
            </>
          ) : (
            <>
              <p className="font-display text-xl text-neutral-800">
                {formatSEK(totalPerHour)}<span className="text-sm font-sans text-neutral-400">/tim</span>
              </p>
              <p className="text-xs text-neutral-400">inkl. moms</p>
            </>
          )}
        </div>
        <Link
          href="/book"
          className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700 group-hover:gap-2 transition-all"
        >
          Boka <ArrowRight size={12} />
        </Link>
      </div>
    </div>
  )
}
