"use client"

import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

export interface PricePoint {
  label: string
  value: number
}

interface PriceChartProps {
  series?: PricePoint[]
  isLoading?: boolean
}

const FALLBACK: PricePoint[] = [
  { label: "Mon", value: 0 },
  { label: "Tue", value: 0 },
  { label: "Wed", value: 0 },
  { label: "Thu", value: 0 },
  { label: "Fri", value: 0 },
]

export function PriceChart({ series, isLoading }: PriceChartProps) {
  const data = series?.length ? series : FALLBACK

  if (isLoading && !series?.length) {
    return (
      <div className="flex items-center justify-center h-[320px] text-muted-foreground text-sm">
        Loading chart...
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} width={48} />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "0.5rem",
          }}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke="hsl(var(--primary))"
          fillOpacity={1}
          fill="url(#colorValue)"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
