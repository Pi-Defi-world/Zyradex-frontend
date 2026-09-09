"use client"

import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

export interface ActivityPoint {
  date: string
  volume: number
}

interface ActivityChartProps {
  series?: ActivityPoint[]
  isLoading?: boolean
}

export function ActivityChart({ series, isLoading }: ActivityChartProps) {
  const data = series?.length ? series.map((p) => ({ label: p.date, value: p.volume })) : []

  if (isLoading && !series?.length) {
    return (
      <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
        Loading activity...
      </div>
    )
  }

  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm border border-dashed border-border rounded-lg">
        No activity yet
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="activityValue" x1="0" y1="0" x2="0" y2="1">
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
          fill="url(#activityValue)"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
