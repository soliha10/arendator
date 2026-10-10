'use client'

import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

export const Dialog = DialogPrimitive.Root
export const DialogTrigger = DialogPrimitive.Trigger
export const DialogClose = DialogPrimitive.Close

export function DialogContent({
  className,
  children,
  title,
  description,
  size = 'md',
}: {
  className?: string
  children: React.ReactNode
  title: string
  description?: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}) {
  const maxW = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }[size]

  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out" />
      <DialogPrimitive.Content
        className={cn(
          // Telefon: pastdan chiqadigan varaq — barmoq yetadigan zonada.
          // sm dan boshlab odatdagi markazlashgan oyna.
          'scroll-contain fixed inset-x-0 bottom-0 z-50 max-h-[90dvh] overflow-y-auto',
          'border-x-0 border-b-0 border-t border-border bg-surface surface-shadow',
          'rounded-t-2xl p-5 pb-[calc(1.25rem+var(--safe-b))]',
          'sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-[calc(100vw-2rem)]',
          'sm:-translate-x-1/2 sm:-translate-y-1/2 sm:pb-5',
          'sm:rounded-[var(--radius-card)] sm:border-x sm:border-b sm:border-border',
          maxW,
          className,
        )}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <DialogPrimitive.Title className="text-lg font-semibold text-text">
              {title}
            </DialogPrimitive.Title>
            {description ? (
              <DialogPrimitive.Description className="mt-1 text-sm text-muted">
                {description}
              </DialogPrimitive.Description>
            ) : null}
          </div>
          <DialogPrimitive.Close
            className="tap -mr-2 -mt-2 inline-flex items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-text"
            aria-label="Yopish"
          >
            <X className="size-5" aria-hidden />
          </DialogPrimitive.Close>
        </div>
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
}
