import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

interface OfferCardSkeletonProps {
  variant?: "grid" | "horizontal"
  className?: string
}

export function OfferCardSkeleton({
  variant = "grid",
  className,
}: OfferCardSkeletonProps) {
  if (variant === "horizontal") {
    return (
      <Card className={cn("flex overflow-hidden", className)}>
        <Skeleton className="h-32 w-32 flex-shrink-0" />
        <CardContent className="flex-1 p-4">
          <Skeleton className="h-5 w-3/4 mb-2" />
          <Skeleton className="h-4 w-full mb-3" />
          <Skeleton className="h-6 w-20" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <Skeleton className="aspect-square w-full" />
      <CardContent className="p-4 space-y-3">
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        <Skeleton className="h-6 w-24" />
        <div className="flex items-center justify-between pt-1">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-20" />
        </div>
      </CardContent>
    </Card>
  )
}
