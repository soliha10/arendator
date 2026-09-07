import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean
  prefixNode?: React.ReactNode
  suffixNode?: React.ReactNode
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, invalid, prefixNode, suffixNode, ...props }, ref) => {
    const field = (
      <input
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cn(
          'h-10 w-full rounded-[10px] border bg-surface px-3 text-sm text-text',
          'placeholder:text-subtle transition-colors',
          'disabled:cursor-not-allowed disabled:opacity-60',
          invalid ? 'border-danger' : 'border-border hover:border-border-strong',
          prefixNode && 'pl-9',
          suffixNode && 'pr-12',
          className,
        )}
        {...props}
      />
    )

    if (!prefixNode && !suffixNode) return field

    return (
      <div className="relative">
        {prefixNode ? (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-subtle [&_svg]:size-4">
            {prefixNode}
          </span>
        ) : null}
        {field}
        {suffixNode ? (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted">
            {suffixNode}
          </span>
        ) : null}
      </div>
    )
  },
)
Input.displayName = 'Input'

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }
>(({ className, invalid, ...props }, ref) => (
  <textarea
    ref={ref}
    aria-invalid={invalid || undefined}
    className={cn(
      'min-h-24 w-full rounded-[10px] border bg-surface px-3 py-2 text-sm text-text',
      'placeholder:text-subtle transition-colors resize-y',
      invalid ? 'border-danger' : 'border-border hover:border-border-strong',
      className,
    )}
    {...props}
  />
))
Textarea.displayName = 'Textarea'

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }
>(({ className, invalid, children, ...props }, ref) => (
  <div className="relative">
    <select
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        'h-10 w-full appearance-none rounded-[10px] border bg-surface px-3 pr-9 text-sm text-text',
        'transition-colors disabled:cursor-not-allowed disabled:opacity-60',
        invalid ? 'border-danger' : 'border-border hover:border-border-strong',
        className,
      )}
      {...props}
    >
      {children}
    </select>
    <svg
      className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-subtle"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden
    >
      <path d="m6 8 4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </div>
))
Select.displayName = 'Select'
