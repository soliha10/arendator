'use client'

import * as React from 'react'
import { Link, useMessages, useRouter } from '@/i18n/client'
import { fmt } from '@/i18n/format'
import {
  Archive, CheckCircle2, ExternalLink, MoreVertical, Pause,
  Pencil, Play, Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import type { ListingStatus } from '@prisma/client'
import { changeListingStatusAction, deleteListingAction } from '@/server/actions/listings'
import {
  Dropdown, DropdownContent, DropdownItem, DropdownSeparator, DropdownTrigger,
} from '@/components/ui/dropdown'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

export function ListingRowActions({
  listingId,
  slug,
  title,
  status,
}: {
  listingId: string
  slug: string
  title: string
  status: ListingStatus
}) {
  const router = useRouter()
  const m = useMessages().cabinet
  const t = m.rowActions
  const [pending, startTransition] = React.useTransition()
  const [confirmOpen, setConfirmOpen] = React.useState(false)

  const run = (action: 'pause' | 'activate' | 'archive' | 'rented') => {
    startTransition(async () => {
      const result = await changeListingStatusAction(listingId, action)
      if (result.status === 'error') toast.error(result.message ?? m.common.error)
      else {
        toast.success(result.message ?? m.common.done)
        router.refresh()
      }
    })
  }

  const remove = () => {
    startTransition(async () => {
      const result = await deleteListingAction(listingId)
      if (result.status === 'error') {
        toast.error(result.message ?? m.common.error)
      } else {
        toast.success(result.message ?? m.common.deleted)
        setConfirmOpen(false)
        router.refresh()
      }
    })
  }

  return (
    <>
      <Dropdown>
        <DropdownTrigger asChild>
          <button
            type="button"
            aria-label={t.aria}
            disabled={pending}
            className="rounded-lg p-2 text-muted transition-colors hover:bg-surface-2 hover:text-text disabled:opacity-50"
          >
            <MoreVertical className="size-4" />
          </button>
        </DropdownTrigger>
        <DropdownContent>
          <DropdownItem asChild>
            <Link href={`/kabinet/elon/${listingId}/tahrirlash`}>
              <Pencil /> {t.edit}
            </Link>
          </DropdownItem>
          <DropdownItem asChild>
            <Link href={`/elon/${slug}`} target="_blank">
              <ExternalLink /> {t.view}
            </Link>
          </DropdownItem>

          <DropdownSeparator />

          {status === 'ACTIVE' ? (
            <>
              <DropdownItem onSelect={() => run('pause')}>
                <Pause /> {t.pause}
              </DropdownItem>
              <DropdownItem onSelect={() => run('rented')}>
                <CheckCircle2 /> {t.rented}
              </DropdownItem>
            </>
          ) : null}

          {(status === 'PAUSED' || status === 'DRAFT' || status === 'REJECTED' || status === 'RENTED') ? (
            <DropdownItem onSelect={() => run('activate')}>
              <Play /> {t.activate}
            </DropdownItem>
          ) : null}

          {status !== 'ARCHIVED' ? (
            <DropdownItem onSelect={() => run('archive')}>
              <Archive /> {t.archive}
            </DropdownItem>
          ) : null}

          <DropdownSeparator />

          <DropdownItem
            danger
            onSelect={(e) => {
              e.preventDefault()
              setConfirmOpen(true)
            }}
          >
            <Trash2 /> {t.delete}
          </DropdownItem>
        </DropdownContent>
      </Dropdown>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent
          title={t.deleteTitle}
          description={fmt(t.deleteText, { title })}
          size="sm"
        >
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              {t.cancel}
            </Button>
            <Button variant="danger" loading={pending} onClick={remove}>
              <Trash2 /> {t.delete}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
