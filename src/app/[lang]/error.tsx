'use client'

import * as React from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useMessages } from '@/i18n/client'
import { fmt } from '@/i18n/format'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const t = useMessages().pages.error
  React.useEffect(() => {
    console.error('Sahifa xatosi:', error)
  }, [error])

  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-10 sm:px-5 sm:py-12">
      <div className="max-w-md text-center">
        <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-danger-soft text-danger">
          <AlertTriangle className="size-7" />
        </span>
        <h1 className="mt-4 text-xl font-bold tracking-tight text-text">
          {t.title}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          {t.text}
        </p>
        {error.digest ? (
          <p className="tabular mt-3 text-[12px] text-subtle">{fmt(t.code, { code: error.digest })}</p>
        ) : null}
        <Button onClick={reset} className="mt-5">
          <RotateCcw /> {t.retry}
        </Button>
      </div>
    </div>
  )
}
