'use client'

import * as React from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
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
          Nimadir notoʻgʻri ketdi
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Kutilmagan xatolik yuz berdi. Sahifani qayta yuklab koʻring — muammo
          takrorlansa, biz bilan bogʻlaning.
        </p>
        {error.digest ? (
          <p className="tabular mt-3 text-[12px] text-subtle">Xato kodi: {error.digest}</p>
        ) : null}
        <Button onClick={reset} className="mt-5">
          <RotateCcw /> Qayta urinish
        </Button>
      </div>
    </div>
  )
}
