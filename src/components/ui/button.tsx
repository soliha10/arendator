import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[10px] font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary:
          'bg-primary text-primary-fg hover:bg-primary-hover shadow-sm',
        secondary:
          'bg-surface-2 text-text hover:bg-surface-3 border border-border',
        outline:
          'border border-border-strong bg-surface text-text hover:bg-surface-2',
        ghost: 'text-text hover:bg-surface-2',
        soft: 'bg-primary-soft text-primary hover:brightness-95',
        danger: 'bg-danger text-white hover:brightness-110',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      // Mobilda har bir oʻlcham bir pogʻona kattaroq: barmoq uchun
      // 44px atrofidagi nishon kerak, sichqoncha uchun esa ixchamroq.
      size: {
        sm: 'h-9 px-3 text-[13px] [&_svg]:size-4 lg:h-8',
        md: 'h-11 px-4 text-sm [&_svg]:size-4 lg:h-10',
        lg: 'h-12 px-6 text-[15px] [&_svg]:size-5',
        icon: 'size-11 [&_svg]:size-4 lg:size-10',
        'icon-sm': 'size-9 [&_svg]:size-4 lg:size-8',
      },
      block: { true: 'w-full', false: '' },
    },
    defaultVariants: { variant: 'primary', size: 'md', block: false },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, block, asChild, loading, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size, block }), className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <>
            <Loader2 className="animate-spin" aria-hidden />
            {children}
          </>
        ) : (
          children
        )}
      </Comp>
    )
  },
)
Button.displayName = 'Button'

export { buttonVariants }
