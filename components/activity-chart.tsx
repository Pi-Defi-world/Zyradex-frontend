"use client"

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

export interface ActivityPoint {
  date: string
  volume: number
}

interface ActivityChartProps {
  series?: ActivityPoint[]
  isLoading?: boolean
}

const FALLBACK_SERIES: ActivityPoint[] = [
  { date: "Jan 1", volume: 0 },
  { date: "Jan 5", volume: 0 },
  { date: "Jan 10", volume: 0 },
  { date: "Jan 15", volume: 0 },
  { date: "Jan 20", volume: 0 },
  { date: "Jan 25", volume: 0 },
  { date: "Jan 30", volume: 0 },
]

export function ActivityChart({ series, isLoading }: ActivityChartProps) {
  const data = series?.length ? series : FALLBACK_SERIES

  if (isLoading && !series?.length) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm">
        Loading activity...
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${value}`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
          }}
        />
        <Line type="monotone" dataKey="volume" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}
