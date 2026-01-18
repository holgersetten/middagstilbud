import { cn } from "@/lib/utils"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Badge } from "@/components/ui/badge"

export interface Store {
  id: string
  name: string
  logo?: string
}

interface StoreFilterProps {
  stores: Store[]
  selectedIds?: string[]
  onSelect?: (store: Store) => void
  className?: string
}

export function StoreFilter({
  stores,
  selectedIds = [],
  onSelect,
  className,
}: StoreFilterProps) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {stores.map((store) => {
        const isSelected = selectedIds.includes(store.id)
        return (
          <button
            key={store.id}
            onClick={() => onSelect?.(store)}
            className={cn(
              "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-all hover:border-foreground/20",
              isSelected
                ? "border-foreground bg-foreground text-background"
                : "border-border bg-background text-foreground"
            )}
          >
            {store.logo && (
              <div className="h-4 w-4 overflow-hidden rounded">
                <img
                  src={store.logo || "/placeholder.svg"}
                  alt={store.name}
                  className="h-full w-full object-contain"
                />
              </div>
            )}
            <span>{store.name}</span>
          </button>
        )
      })}
    </div>
  )
}
