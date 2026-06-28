"use client"

import { useState, useMemo } from "react"
import { ChevronDown, ChevronRight, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { cn } from "@/lib/utils"
import { TokenIcon } from "@/components/token-icon"

export interface TokenOption {
  value: string // format: "CODE:ISSUER" or "native"
  code: string
  issuer?: string | null
  name?: string
  image?: string | null
  balance?: number
}

interface TokenSelectProps {
  options: TokenOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
}

export function TokenSelect({ options, value, onChange, placeholder = "Select token", disabled }: TokenSelectProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")

  const selected = useMemo(() => options.find((o) => o.value === value), [options, value])

  const filtered = useMemo(() => {
    if (!search.trim()) return options
    const q = search.toLowerCase()
    return options.filter(
      (o) =>
        o.code.toLowerCase().includes(q) ||
        (o.name && o.name.toLowerCase().includes(q))
    )
  }, [options, search])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          disabled={disabled}
          aria-expanded={open}
          className={cn(
            "w-auto min-w-[140px] justify-between gap-2 rounded-xl",
            !selected && "text-muted-foreground"
          )}
        >
          {selected ? (
            <div className="flex items-center gap-2">
              <TokenIcon
                image={selected.image}
                code={selected.code}
                issuer={selected.issuer}
                size="sm"
              />
              <span className="font-medium text-sm">{selected.name || selected.code}</span>
            </div>
          ) : (
            <span className="text-sm">{placeholder}</span>
          )}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[260px] p-0" align="start">
        <Command shouldFilter={false}>
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <input
              placeholder="Search tokens..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <CommandList>
            <CommandEmpty>No token found.</CommandEmpty>
            <CommandGroup>
              {filtered.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={() => {
                    onChange(option.value)
                    setOpen(false)
                    setSearch("")
                  }}
                  className="flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <TokenIcon
                      image={option.image}
                      code={option.code}
                      issuer={option.issuer}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <span className="text-sm font-medium truncate block">
                        {option.name || option.code}
                      </span>
                      {option.issuer && (
                        <span className="text-[10px] text-muted-foreground font-mono truncate block">
                          {option.code}:{option.issuer.slice(0, 6)}...
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {option.balance !== undefined && (
                      <span className="text-xs text-muted-foreground">
                        {option.balance.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                      </span>
                    )}
                    {value === option.value && <ChevronRight className="h-4 w-4 text-green-500" />}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
