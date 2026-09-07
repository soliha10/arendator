'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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
  const [pending, startTransition] = React.useTransition()
  const [confirmOpen, setConfirmOpen] = React.useState(false)

  const run = (action: 'pause' | 'activate' | 'archive' | 'rented') => {
    startTransition(async () => {
      const result = await changeListingStatusAction(listingId, action)
      if (result.status === 'error') toast.error(result.message ?? 'Xatolik')
      else {
        toast.success(result.message ?? 'Bajarildi')
        router.refresh()
      }
    })
  }

  const remove = () => {
    startTransition(async () => {
      const result = await deleteListingAction(listingId)
      if (result.status === 'error') {
        toast.error(result.message ?? 'Xatolik')
      } else {
        toast.success(result.message ?? 'Oʻchirildi')
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
            aria-label="Amallar"
            disabled={pending}
            className="rounded-lg p-2 text-muted transition-colors hover:bg-surface-2 hover:text-text disabled:opacity-50"
          >
            <MoreVertical className="size-4" />
          </button>
        </DropdownTrigger>
        <DropdownContent>
          <DropdownItem asChild>
            <Link href={`/kabinet/elon/${listingId}/tahrirlash`}>
              <Pencil /> Tahrirlash
            </Link>
          </DropdownItem>
          <DropdownItem asChild>
            <Link href={`/elon/${slug}`} target="_blank">
              <ExternalLink /> Saytda koʻrish
            </Link>
          </DropdownItem>

          <DropdownSeparator />

          {status === 'ACTIVE' ? (
            <>
              <DropdownItem onSelect={() => run('pause')}>
                <Pause /> Vaqtincha toʻxtatish
              </DropdownItem>
              <DropdownItem onSelect={() => run('rented')}>
                <CheckCircle2 /> Berilgan deb belgilash
              </DropdownItem>
            </>
          ) : null}

          {(status === 'PAUSED' || status === 'DRAFT' || status === 'REJECTED' || status === 'RENTED') ? (
            <DropdownItem onSelect={() => run('activate')}>
              <Play /> Faollashtirish
            </DropdownItem>
          ) : null}

          {status !== 'ARCHIVED' ? (
            <DropdownItem onSelect={() => run('archive')}>
              <Archive /> Arxivlash
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
            <Trash2 /> Oʻchirish
          </DropdownItem>
        </DropdownContent>
      </Dropdown>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent
          title="Eʼlonni oʻchirish"
          description={`“${title}” butunlay oʻchiriladi. Bu amalni qaytarib boʻlmaydi — barcha toʻlov shartlari, grafik va arizalar ham oʻchadi.`}
          size="sm"
        >
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Bekor qilish
            </Button>
            <Button variant="danger" loading={pending} onClick={remove}>
              <Trash2 /> Oʻchirish
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
