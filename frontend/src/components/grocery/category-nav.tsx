import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export interface Category {
  id: string
  name: string
  icon?: string
  imageUrl?: string
}

interface CategoryNavProps {
  categories: Category[]
  selectedId?: string
  onSelect?: (category: Category) => void
  className?: string
}

export function CategoryNav({
  categories,
  selectedId,
  onSelect,
  className,
}: CategoryNavProps) {
  return (
    <nav className={cn("w-full", className)}>
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map((category) => (
          <Button
            key={category.id}
            variant={selectedId === category.id ? "default" : "outline"}
            className={cn(
              "shrink-0 rounded-lg h-9 px-4 text-sm font-medium transition-all",
              selectedId === category.id
                ? "border-foreground bg-foreground text-background"
                : "border-border hover:border-foreground/20"
            )}
            onClick={() => onSelect?.(category)}
          >
            {category.icon && <span className="mr-1.5">{category.icon}</span>}
            {category.name}
          </Button>
        ))}
      </div>
    </nav>
  )
}

interface CategoryGridProps {
  categories: Category[]
  onSelect?: (category: Category) => void
  className?: string
}

export function CategoryGrid({
  categories,
  onSelect,
  className,
}: CategoryGridProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6",
        className
      )}
    >
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => onSelect?.(category)}
          className="group flex flex-col items-center gap-3 rounded-lg bg-card p-4 border border-border transition-all hover:border-foreground/20 hover:shadow-sm"
        >
          {category.imageUrl ? (
            <div className="relative h-16 w-16 overflow-hidden rounded-lg bg-muted">
              <img
                src={category.imageUrl || "/placeholder.svg"}
                alt={category.name}
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
              />
            </div>
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-muted text-2xl">
              {category.icon || "📦"}
            </div>
          )}
          <span className="text-sm font-medium text-foreground text-center line-clamp-2">
            {category.name}
          </span>
        </button>
      ))}
    </div>
  )
}

interface SubcategoryNavProps {
  subcategories: Category[]
  selectedId?: string
  onSelect?: (subcategory: Category) => void
  onBack?: () => void
  parentName?: string
  className?: string
}

export function SubcategoryNav({
  subcategories,
  selectedId,
  onSelect,
  onBack,
  parentName,
  className,
}: SubcategoryNavProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {onBack && parentName && (
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <span>←</span>
          <span>Tilbake til {parentName}</span>
        </button>
      )}
      <div className="flex flex-wrap gap-2">
        {subcategories.map((subcategory) => (
          <Button
            key={subcategory.id}
            variant={selectedId === subcategory.id ? "default" : "outline"}
            size="sm"
            className="rounded-xl"
            onClick={() => onSelect?.(subcategory)}
          >
            {subcategory.icon && (
              <span className="mr-1">{subcategory.icon}</span>
            )}
            {subcategory.name}
          </Button>
        ))}
      </div>
    </div>
  )
}
