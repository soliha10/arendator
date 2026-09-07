import * as React from 'react'
import { cn } from '@/lib/utils'

export function Label({
  className,
  required,
  children,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement> & { required?: boolean }) {
  return (
    <label className={cn('block text-sm font-medium text-text', className)} {...props}>
      {children}
      {required ? <span className="text-danger"> *</span> : null}
    </label>
  )
}

export function Field({
  label,
  hint,
  error,
  required,
  htmlFor,
  className,
  children,
}: {
  label?: React.ReactNode
  hint?: React.ReactNode
  error?: string | string[] | null
  required?: boolean
  htmlFor?: string
  className?: string
  children: React.ReactNode
}) {
  const errorText = Array.isArray(error) ? error[0] : error
  return (
    <div className={cn('space-y-1.5', className)}>
      {label ? (
        <Label htmlFor={htmlFor} required={required}>
          {label}
        </Label>
      ) : null}
      {children}
      {errorText ? (
        <p className="text-[13px] text-danger">{errorText}</p>
      ) : hint ? (
        <p className="text-[13px] text-muted">{hint}</p>
      ) : null}
    </div>
  )
}
