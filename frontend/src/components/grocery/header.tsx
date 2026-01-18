'use client';

import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface HeaderProps {
  title: string
  subtitle?: string
  onSearch?: (query: string) => void
  className?: string
}

export function Header({ title, subtitle, onSearch, className }: HeaderProps) {
  return (
    <header className={cn("space-y-8", className)}>
      <div className="space-y-3">
        <h1 className="text-5xl md:text-6xl font-bold tracking-tighter text-foreground">
          {title}
        </h1>
        {subtitle && (
          <p className="text-muted-foreground text-xl font-normal max-w-2xl">{subtitle}</p>
        )}
      </div>
      {onSearch && (
        <div className="relative max-w-xl">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Søk etter produkter..."
            className="pl-10 h-12 rounded-lg border-border bg-background transition-all duration-200 focus:border-foreground text-sm"
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>
      )}
    </header>
  )
}
