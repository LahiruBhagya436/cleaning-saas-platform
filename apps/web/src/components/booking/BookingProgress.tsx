import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  steps:   string[]
  current: number
}

export function BookingProgress({ steps, current }: Props) {
  return (
    <div className="flex items-center justify-center gap-0">
      {steps.map((label, i) => {
        const done   = i < current
        const active = i === current

        return (
          <div key={label} className="flex items-center">
            {/* Circle */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300',
                  done   && 'bg-teal-500 text-white',
                  active && 'bg-brand-600 text-white ring-4 ring-brand-100',
                  !done && !active && 'bg-white border-2 border-neutral-200 text-neutral-400'
                )}
              >
                {done ? <Check size={16} strokeWidth={2.5} /> : i + 1}
              </div>
              <span
                className={cn(
                  'mt-1.5 text-xs font-medium hidden sm:block',
                  active   && 'text-brand-600',
                  done     && 'text-teal-600',
                  !done && !active && 'text-neutral-400'
                )}
              >
                {label}
              </span>
            </div>

            {/* Connector */}
            {i < steps.length - 1 && (
              <div
                className={cn(
                  'h-0.5 w-12 sm:w-20 mx-1 mb-5 transition-colors duration-300',
                  i < current ? 'bg-teal-400' : 'bg-neutral-200'
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
