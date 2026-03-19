"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

interface PageBackHeaderProps {
  title?: string
  /** Optional right-side content (e.g. actions) */
  children?: React.ReactNode
  className?: string
}

export function PageBackHeader({ title, children, className = "" }: PageBackHeaderProps) {
  const router = useRouter()
  return (
    <div className={`flex items-center justify-between gap-4 mb-4 ${className}`}>
      <div className="flex items-center gap-4 min-w-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          aria-label="Back"
          className="shrink-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        {title && (
          <h1 className="text-xl font-semibold text-foreground truncate">{title}</h1>
        )}
      </div>
      {children}
    </div>
  )
}
