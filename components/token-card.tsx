"use client"

import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Users, Droplets } from "lucide-react"

export interface TokenSummary {
  code: string
  issuer?: string | null
  name?: string
  image?: string
  totalSupply?: number
  circulating?: number
  holders?: number
  liquidityPools?: number
  description?: string
}

interface TokenCardProps {
  token: TokenSummary
  index?: number
  variant?: "default" | "compact"
}

const GRADIENTS = [
  "from-blue-500/20 to-cyan-500/20",
  "from-purple-500/20 to-pink-500/20",
  "from-orange-500/20 to-red-500/20",
  "from-green-500/20 to-emerald-500/20",
  "from-indigo-500/20 to-violet-500/20",
]

export function TokenCard({ token, index = 0, variant = "default" }: TokenCardProps) {
  if (!token?.code) return null

  const totalSupply = Number(token.totalSupply ?? 0)
  const circulating = Number(token.circulating ?? totalSupply)
  const progress = totalSupply > 0 ? Math.min((circulating / totalSupply) * 100, 100) : 0
  const colorIndex = token.code.charCodeAt(0) % GRADIENTS.length
  const badgeLabel = token.holders ? `${token.holders.toLocaleString()} holders` : undefined

  if (variant === "compact") {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
        <div className="p-3 bg-card border-border hover:border-primary/50 transition-all duration-300 cursor-pointer hover:shadow-lg group rounded-2xl">
          <div
            className={`aspect-square mb-2 rounded-lg overflow-hidden bg-gradient-to-br ${GRADIENTS[colorIndex]} flex items-center justify-center group-hover:scale-105 transition-transform duration-300`}
          >
            {token.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={token.image} alt={token.code} className="object-cover w-full h-full" loading="lazy" />
            ) : (
              <span className="text-2xl font-bold text-foreground">{token.code.slice(0, 2)}</span>
            )}
          </div>
          <div className="flex justify-between gap-4 text-xs">
            <p className="font-semibold text-sm truncate text-foreground">{token.code}</p>
            {typeof token.liquidityPools === "number" && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Droplets className="w-3 h-3" />
                <span>{token.liquidityPools} pools</span>
              </div>
            )}
          </div>
          <p className="flex justify-between text-xs mt-1">
            <span className="text-muted-foreground">Total Supply</span>
            <span className="text-primary font-semibold">
              {totalSupply.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </span>
          </p>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: (index % 12) * 0.05 }}>
      <Card className="p-3 bg-card border-border hover:border-primary/50 transition-all duration-300 cursor-pointer hover:shadow-lg group">
        <div className="flex gap-4">
          <div
            className={`w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-gradient-to-br ${GRADIENTS[colorIndex]} flex items-center justify-center group-hover:scale-105 transition-transform duration-300`}
          >
            {token.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={token.image} alt={token.code} className="object-cover w-full h-full" loading="lazy" />
            ) : (
              <span className="text-3xl font-bold text-foreground">{token.code.slice(0, 2)}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-1">
              <div className="min-w-0">
                <h3 className="font-bold text-lg truncate text-foreground">{token.code}</h3>
                {token.name && <p className="text-xs text-muted-foreground truncate">{token.name}</p>}
              </div>
              {badgeLabel && (
                <Badge variant="secondary" className="ml-2 flex-shrink-0">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  {badgeLabel}
                </Badge>
              )}
            </div>
            {token.issuer && (
              <p className="text-xs text-muted-foreground mb-3 font-mono truncate">
                {token.issuer.slice(0, 8)}...{token.issuer.slice(-8)}
              </p>
            )}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Total Supply</span>
                <span className="text-primary font-semibold">
                  {totalSupply.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </span>
              </div>
              <Progress value={progress} className="h-2" />
              <div className="flex justify-between gap-4 text-xs">
                {typeof token.holders === "number" && (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Users className="w-3 h-3" />
                    <span>{token.holders.toLocaleString()}</span>
                  </div>
                )}
                {typeof token.liquidityPools === "number" && (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Droplets className="w-3 h-3" />
                    <span>{token.liquidityPools} pools</span>
                  </div>
                )}
              </div>
              {token.description && (
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {token.description}
                </p>
              )}
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}
