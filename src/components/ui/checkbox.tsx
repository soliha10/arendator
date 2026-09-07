'use client'

import * as React from 'react'
import * as CheckboxPrimitive from '@radix-ui/react-checkbox'
import * as SwitchPrimitive from '@radix-ui/react-switch'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      className={cn(
        'flex size-[18px] shrink-0 items-center justify-center rounded-[5px] border border-border-strong bg-surface transition-colors',
        'data-[state=checked]:border-primary data-[state=checked]:bg-primary',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator>
        <Check className="size-3.5 text-primary-fg" strokeWidth={3} />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

/** Belgi + matn: filtrlar va formalarda ishlatiladi */
export function CheckboxRow({
  checked,
  onCheckedChange,
  label,
  count,
  disabled,
  name,
  value,
}: {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  label: React.ReactNode
  count?: number
  disabled?: boolean
  name?: string
  value?: string
}) {
  return (
    <label
      className={cn(
        'flex cursor-pointer items-center gap-2.5 rounded-lg px-1.5 py-1.5 transition-colors hover:bg-surface-2',
        disabled && 'cursor-not-allowed opacity-50',
      )}
    >
      <Checkbox
        checked={checked}
        onCheckedChange={(v) => onCheckedChange(v === true)}
        disabled={disabled}
        name={name}
        value={value}
      />
      <span className="flex-1 text-sm text-text">{label}</span>
      {count !== undefined ? (
        <span className="tabular text-xs text-subtle">{count}</span>
      ) : null}
    </label>
  )
}

export function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      className={cn(
        'relative h-[22px] w-[38px] shrink-0 rounded-full border border-border-strong bg-surface-3 transition-colors',
        'data-[state=checked]:border-primary data-[state=checked]:bg-primary',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb className="block size-[16px] translate-x-[2px] rounded-full bg-white shadow-sm transition-transform data-[state=checked]:translate-x-[18px]" />
    </SwitchPrimitive.Root>
  )
}

export function SwitchRow({
  checked,
  onCheckedChange,
  label,
  hint,
  disabled,
}: {
  checked: boolean
  onCheckedChange: (v: boolean) => void
  label: React.ReactNode
  hint?: React.ReactNode
  disabled?: boolean
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 py-1.5">
      <span className="flex-1">
        <span className="block text-sm font-medium text-text">{label}</span>
        {hint ? <span className="mt-0.5 block text-[13px] text-muted">{hint}</span> : null}
      </span>
      <Switch checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
    </label>
  )
}
