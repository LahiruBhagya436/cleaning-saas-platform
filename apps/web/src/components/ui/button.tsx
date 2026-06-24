import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default:
          'bg-brand-600 text-white shadow hover:bg-brand-700 active:scale-[0.98]',
        destructive:
          'bg-red-600 text-white shadow hover:bg-red-700',
        outline:
          'border border-neutral-200 bg-white shadow-sm hover:bg-neutral-50 hover:border-neutral-300 text-neutral-800',
        secondary:
          'bg-neutral-100 text-neutral-800 hover:bg-neutral-200',
        ghost:
          'hover:bg-neutral-100 text-neutral-700',
        link:
          'text-brand-600 underline-offset-4 hover:underline p-0 h-auto',
        teal:
          'bg-teal-500 text-white shadow hover:bg-teal-600 active:scale-[0.98]',
      },
      size: {
        default: 'h-10 px-5 py-2',
        sm:      'h-8  px-3 py-1.5 text-xs',
        lg:      'h-12 px-7 py-3 text-base',
        xl:      'h-14 px-8 py-4 text-base',
        icon:    'h-10 w-10',
        'icon-sm':'h-8 w-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      size:    'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled ?? loading}
        {...props}
      >
        {loading ? (
          <>
            <svg
              className="animate-spin size-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            <span>Laddar...</span>
          </>
        ) : (
          children
        )}
      </Comp>
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
