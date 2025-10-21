"use client"

import * as React from "react"
import { CartesianGrid, Line, LineChart, XAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

// Mock price data for the chart
const chartData = [
  { date: "2024-01-01", price: 0.95 },
  { date: "2024-01-02", price: 1.02 },
  { date: "2024-01-03", price: 0.98 },
  { date: "2024-01-04", price: 1.05 },
  { date: "2024-01-05", price: 1.08 },
  { date: "2024-01-06", price: 1.12 },
  { date: "2024-01-07", price: 1.15 },
  { date: "2024-01-08", price: 1.18 },
  { date: "2024-01-09", price: 1.22 },
  { date: "2024-01-10", price: 1.25 },
  { date: "2024-01-11", price: 1.28 },
  { date: "2024-01-12", price: 1.32 },
  { date: "2024-01-13", price: 1.35 },
  { date: "2024-01-14", price: 1.38 },
  { date: "2024-01-15", price: 1.42 },
  { date: "2024-01-16", price: 1.45 },
  { date: "2024-01-17", price: 1.48 },
  { date: "2024-01-18", price: 1.52 },
  { date: "2024-01-19", price: 1.55 },
  { date: "2024-01-20", price: 1.58 },
  { date: "2024-01-21", price: 1.62 },
  { date: "2024-01-22", price: 1.65 },
  { date: "2024-01-23", price: 1.68 },
  { date: "2024-01-24", price: 1.72 },
  { date: "2024-01-25", price: 1.75 },
  { date: "2024-01-26", price: 1.78 },
  { date: "2024-01-27", price: 1.82 },
  { date: "2024-01-28", price: 1.85 },
  { date: "2024-01-29", price: 1.88 },
  { date: "2024-01-30", price: 1.92 },
]

const priceChartConfig = {
  price: {
    label: "Price",
    theme: {
      light: "hsl(142, 76%, 36%)",
      dark: "hsl(142, 76%, 36%)",
    },
  },
} satisfies ChartConfig

const timePeriods = [
  { label: "15m", value: "15m" },
  { label: "1H", value: "1h" },
  { label: "4H", value: "4h" },
  { label: "1D", value: "1d" },
  { label: "1W", value: "1w" },
]

export function PriceChart() {
  const [selectedPeriod, setSelectedPeriod] = React.useState("1d")
  const [fromToken] = React.useState("PI")
  const [toToken] = React.useState("PIUSD")

  // Calculate price change
  const currentPrice = chartData[chartData.length - 1]?.price || 0
  const previousPrice = chartData[chartData.length - 2]?.price || 0
  const priceChange = ((currentPrice - previousPrice) / previousPrice) * 100
  const isPositive = priceChange >= 0

  return (
    <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-card/50 to-card/30 backdrop-blur-sm shadow-2xl">
      {/* Premium gradient border effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-blue-500/20 rounded-lg p-px">
        <div className="h-full w-full rounded-lg bg-background/95 backdrop-blur-sm" />
      </div>

      <div className="relative">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                {fromToken} / {toToken}
              </CardTitle>
              <CardDescription className="flex items-center gap-2 mt-1">
                <span className="text-lg font-semibold">${currentPrice.toFixed(2)}</span>
                <span className={`text-sm font-medium ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                  {isPositive ? '+' : ''}{priceChange.toFixed(2)}%
                </span>
              </CardDescription>
            </div>
            <div className="flex gap-1">
              {timePeriods.map((period) => (
                <Button
                  key={period.value}
                  variant={selectedPeriod === period.value ? "default" : "ghost"}
                  size="sm"
                  className={`h-8 px-3 text-xs ${
                    selectedPeriod === period.value
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                      : "hover:bg-muted/50"
                  }`}
                  onClick={() => setSelectedPeriod(period.value)}
                >
                  {period.label}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-2 sm:p-6">
          <ChartContainer
            config={priceChartConfig}
            className="aspect-auto h-[300px] w-full"
          >
            <LineChart
              accessibilityLayer
              data={chartData}
              margin={{
                left: 12,
                right: 12,
                top: 12,
                bottom: 12,
              }}
            >
              <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-muted/30" />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                className="text-xs fill-muted-foreground"
                tickFormatter={(value) => {
                  const date = new Date(value)
                  return date.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })
                }}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    className="w-[150px]"
                    labelFormatter={(value) => {
                      return new Date(value).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    }}
                    formatter={(value) => [`$${Number(value).toFixed(2)}`, "Price"]}
                  />
                }
              />
              <Line
                dataKey="price"
                type="monotone"
                stroke="url(#gradient)"
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 6, stroke: "var(--green-primary)", strokeWidth: 2 }}
              />
              <defs>
                <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--green-primary)" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="var(--green-primary)" stopOpacity={0.1} />
                </linearGradient>
              </defs>
            </LineChart>
          </ChartContainer>
        </CardContent>
      </div>
    </Card>
  )
}
