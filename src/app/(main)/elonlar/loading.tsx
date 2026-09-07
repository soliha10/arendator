import { ListingCardSkeleton, Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="container-page py-6 lg:py-8">
      <Skeleton className="h-8 w-56" />
      <Skeleton className="mt-2 h-4 w-32" />

      <div className="mt-5 grid gap-6 lg:grid-cols-[280px_1fr]">
        <Skeleton className="hidden h-[640px] w-full rounded-[14px] lg:block" />
        <div>
          <div className="mb-4 flex justify-end">
            <Skeleton className="h-10 w-56" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }, (_, i) => (
              <ListingCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
