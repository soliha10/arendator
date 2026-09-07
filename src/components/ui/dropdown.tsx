'use client'

import * as React from 'react'
import * as DropdownPrimitive from '@radix-ui/react-dropdown-menu'
import { cn } from '@/lib/utils'

export const Dropdown = DropdownPrimitive.Root
export const DropdownTrigger = DropdownPrimitive.Trigger

export function DropdownContent({
  className,
  align = 'end',
  children,
}: {
  className?: string
  align?: 'start' | 'center' | 'end'
  children: React.ReactNode
}) {
  return (
    <DropdownPrimitive.Portal>
      <DropdownPrimitive.Content
        align={align}
        sideOffset={6}
        className={cn(
          'z-50 min-w-48 overflow-hidden rounded-xl border border-border bg-surface p-1.5 surface-shadow',
          className,
        )}
      >
        {children}
      </DropdownPrimitive.Content>
    </DropdownPrimitive.Portal>
  )
}

export function DropdownItem({
  className,
  danger,
  ...props
}: React.ComponentProps<typeof DropdownPrimitive.Item> & { danger?: boolean }) {
  return (
    <DropdownPrimitive.Item
      className={cn(
        'flex cursor-pointer select-none items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm outline-none transition-colors',
        'data-[highlighted]:bg-surface-2 [&_svg]:size-4 [&_svg]:text-subtle',
        danger ? 'text-danger [&_svg]:text-danger' : 'text-text',
        className,
      )}
      {...props}
    />
  )
}

export function DropdownLabel({ children }: { children: React.ReactNode }) {
  return (
    <DropdownPrimitive.Label className="px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-subtle">
      {children}
    </DropdownPrimitive.Label>
  )
}

export function DropdownSeparator() {
  return <DropdownPrimitive.Separator className="my-1.5 h-px bg-border" />
}
