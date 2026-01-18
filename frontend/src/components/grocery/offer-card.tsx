'use client';

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export interface Offer {
  id: string
  title: string
  description?: string
  price: number
  originalPrice?: number
  currency: string
  imageUrl: string
  store: string
  storeLogo?: string
  category?: string
  validUntil?: string
}

interface OfferCardProps {
  offer: Offer
  onClick?: (offer: Offer) => void
  className?: string
}

export function OfferCard({ offer, onClick, className }: OfferCardProps) {
  const discount = offer.originalPrice
    ? Math.round(((offer.originalPrice - offer.price) / offer.originalPrice) * 100)
    : null

  return (
    <Card
      className={cn(
        "group cursor-pointer overflow-hidden rounded-xl border border-border bg-card transition-all duration-200 hover:border-foreground/20 hover:shadow-lg py-0 gap-0",
        className
      )}
      onClick={() => onClick?.(offer)}
    >
      <div className="relative aspect-square overflow-hidden bg-muted/50">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <img
          src={offer.imageUrl || "/placeholder.svg"}
          alt={offer.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {discount && discount > 0 && (
          <Badge className="absolute left-3 top-3 rounded-md bg-foreground text-background border-0 font-semibold text-xs px-2.5 py-1">
            -{discount}%
          </Badge>
        )}
        {offer.storeLogo && (
          <div className="absolute right-2 top-2 h-8 w-8 overflow-hidden rounded-lg bg-background shadow-sm">
            <img
              src={offer.storeLogo || "/placeholder.svg"}
              alt={offer.store}
              className="h-full w-full object-contain p-1"
            />
          </div>
        )}
      </div>
      <CardContent className="p-4 space-y-3">
        <div className="space-y-1">
          <h3 className="font-semibold text-foreground line-clamp-2 leading-tight text-sm">
            {offer.title}
          </h3>
          {offer.description && (
            <p className="text-xs text-muted-foreground line-clamp-1">
              {offer.description}
            </p>
          )}
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-foreground tracking-tight">
            {offer.price}
          </span>
          <span className="text-sm text-foreground font-medium">{offer.currency}</span>
          {offer.originalPrice && (
            <span className="text-sm text-muted-foreground line-through ml-auto">
              {offer.originalPrice}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between pt-1 border-t border-border/50">
          <span className="text-xs text-muted-foreground font-medium">
            {offer.store}
          </span>
          {offer.validUntil && (
            <span className="text-xs text-muted-foreground">
              {offer.validUntil}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
