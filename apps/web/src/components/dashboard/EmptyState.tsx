import Link from 'next/link'
import { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  icon:        LucideIcon
  title:       string
  description: string
  action?:     {
    label:   string
    href?:   string
    onClick?: () => void
  }
}

export function EmptyState({ icon: Icon, title, description, action }: Props) {
  return (
    <div className="bg-white border border-dashed border-neutral-200 rounded-xl p-12 text-center">
      <div className="w-12 h-12 rounded-xl bg-neutral-100 flex items-center justify-center mx-auto mb-4">
        <Icon size={22} className="text-neutral-400" />
      </div>
      <h3 className="text-sm font-medium text-neutral-900 mb-1">{title}</h3>
      <p className="text-xs text-neutral-400 mb-5 max-w-xs mx-auto leading-relaxed">
        {description}
      </p>
      {action && (
        action.href ? (
          <Button size="sm" asChild>
            <Link href={action.href}>{action.label}</Link>
          </Button>
        ) : (
          <Button size="sm" onClick={action.onClick}>{action.label}</Button>
        )
      )}
    </div>
  )
}
