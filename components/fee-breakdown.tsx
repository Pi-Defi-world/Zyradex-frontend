import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export interface FeeItem {
  label: string
  value: string
  help?: string
}

interface FeeBreakdownProps {
  title?: string
  items: FeeItem[]
}

export function FeeBreakdown({ title = "Fees", items }: FeeBreakdownProps) {
  if (!items.length) return null

  return (
    <Card className="border border-border/60 bg-muted/40">
      <CardHeader className="py-3 pb-2">
        <CardTitle className="text-sm font-semibold text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-2">
        {items.map((item) => (
          <div key={item.label} className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{item.label}</span>
            <span className="font-medium">{item.value}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

