import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function WordleSkeleton() {
  return (
    <div className="container mx-auto px-4 py-4">
      <div className="grid gap-4 items-start">
        {/* Game Grid Card Skeleton */}
        <Card className="border-none bg-transparent">
          <CardContent className="space-y-4">
            {/* Action buttons skeleton */}
            <div className="flex justify-center gap-2">
              <Skeleton className="h-10 w-32 rounded-full" />
              <Skeleton className="h-10 w-28 rounded-full" />
            </div>

            {/* Word grid skeleton - 6 rows x 5 columns */}
            <div className="grid grid-rows-6 gap-1.5 items-center justify-center">
              {Array.from({ length: 6 }).map((_, rowIndex) => (
                <div key={rowIndex} className="grid grid-cols-5 gap-1.5 items-center justify-center">
                  {Array.from({ length: 5 }).map((_, colIndex) => (
                    <Skeleton key={colIndex} className="size-10 sm:size-11 md:size-12 rounded-full" />
                  ))}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Keyboard and Status Card Skeleton */}
        <Card>
          <CardContent className="space-y-4">
            {/* Keyboard skeleton */}
            <div className="flex flex-col gap-1.5 w-full max-w-full overflow-hidden">
              {/* Top row */}
              <div className="flex justify-center items-center gap-1 sm:gap-1.5 md:gap-2 w-full">
                {Array.from({ length: 10 }).map((_, i) => (
                  <Skeleton key={i} className="size-7 sm:size-8 md:size-9 lg:size-10 rounded-full" />
                ))}
              </div>
              {/* Middle row */}
              <div className="flex justify-center items-center gap-1 sm:gap-1.5 md:gap-2 w-full">
                {Array.from({ length: 9 }).map((_, i) => (
                  <Skeleton key={i} className="size-7 sm:size-8 md:size-9 lg:size-10 rounded-full" />
                ))}
                <Skeleton className="size-7 sm:size-8 md:size-9 lg:size-10 rounded-full ml-0.5 sm:ml-1 md:ml-1.5" />
              </div>
              {/* Bottom row */}
              <div className="flex justify-center items-center gap-1 sm:gap-1.5 md:gap-2 w-full">
                {Array.from({ length: 7 }).map((_, i) => (
                  <Skeleton key={i} className="size-7 sm:size-8 md:size-9 lg:size-10 rounded-full" />
                ))}
                <Skeleton className="size-7 sm:size-8 md:size-9 lg:size-10 rounded-full ml-0.5 sm:ml-1 md:ml-1.5" />
              </div>
            </div>

            {/* Status skeleton */}
            <Skeleton className="h-12 w-full rounded-lg" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
