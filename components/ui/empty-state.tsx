import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { type LucideIcon } from "lucide-react"

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  actionLabel?: string
  actionHref?: string
  onAction?: () => void
  className?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-12 px-4 text-center", className)}>
      <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
        <Icon className="h-7 w-7 text-slate-400 dark:text-slate-500" />
      </div>
      <p className="font-semibold text-slate-900 dark:text-white mb-1">{title}</p>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mb-4">{description}</p>
      {actionLabel && (actionHref ? (
        <Button asChild variant="outline" size="sm">
          <a href={actionHref}>{actionLabel}</a>
        </Button>
      ) : onAction ? (
        <Button variant="outline" size="sm" onClick={onAction}>{actionLabel}</Button>
      ) : null)}
    </div>
  )
}
