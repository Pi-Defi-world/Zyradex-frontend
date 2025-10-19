"use client"

import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import type { IAssetRecord } from "@/lib/types"
import { TrendingUp, Users, Droplets } from "lucide-react"

interface TokenCardProps {
  token: IAssetRecord
  index?: number
  variant?: "default" | "compact"
}

export function TokenCard({ token, index = 0, variant = "default" }: TokenCardProps) {
  const totalSupply = Number.parseFloat(token?.balances?.authorized)
  const progress = Math.min((totalSupply / 1000000) * 100, 100)




  // Generate a consistent color based on token code
  const colorIndex = token?.asset_code?.charCodeAt(0) % 5
  const gradients = [
    "from-blue-500/20 to-cyan-500/20",
    "from-purple-500/20 to-pink-500/20",
    "from-orange-500/20 to-red-500/20",
    "from-green-500/20 to-emerald-500/20",
    "from-indigo-500/20 to-violet-500/20",
  ]


  if(!token){
    return null
  }

  if (variant === "compact") {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
        <div className="p-3 bg-card border-border hover:border-primary/50 transition-all duration-300 cursor-pointer hover:shadow-lg group rounded-2xl">
          <div
            className={`aspect-square mb-2 rounded-lg overflow-hidden bg-gradient-to-br ${gradients[colorIndex]} flex items-center justify-center group-hover:scale-105 transition-transform duration-300`}
          >
            {token.metadata?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={token.metadata.image}
                alt={token.asset_code}
                className="object-cover w-full h-full"
                loading="lazy"
              />
            ) : (
              <span className="text-2xl font-bold text-foreground">
                {token.asset_code.slice(0, 2)}
              </span>
            )}
          </div>
          <div className="flex justify-between gap-4 text-xs">
            <p className="font-semibold text-sm truncate text-foreground">{token.asset_code}</p>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Droplets className="w-3 h-3" />
              <span>{token.num_liquidity_pools} pools</span>
            </div>
          </div>
          <p className="flex justify-between text-xs">
          <span className="text-muted-foreground">Total Supply</span>
                <span className="text-primary font-semibold">
                  {totalSupply.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </span>
            {/* {totalSupply.toLocaleString(undefined, { maximumFractionDigits: 0 })} */}
          </p>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: (index % 12) * 0.05 }}
    >
      <Card className="p-3 bg-card border-border hover:border-primary/50 transition-all duration-300 cursor-pointer hover:shadow-lg group">
        <div className="flex gap-4">
          <div
            className={`w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-gradient-to-br ${gradients[colorIndex]} flex items-center justify-center group-hover:scale-105 transition-transform duration-300`}
          >
            <span className="text-3xl font-bold text-foreground">{token?.asset_code?.slice(0, 2)}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-1">
              <h3 className="font-bold text-lg truncate text-foreground">{token?.asset_code}</h3>
              {token.num_liquidity_pools > 0 && (
                <Badge variant="secondary" className="ml-2 flex-shrink-0">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Active
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mb-3 truncate font-mono">
              {token.asset_issuer.slice(0, 8)}...{token.asset_issuer.slice(-8)}
            </p>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Total Supply</span>
                <span className="text-primary font-semibold">
                  {totalSupply.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </span>
              </div>
              <Progress value={progress} className="h-2" />
              <div className="flex justify-between gap-4 text-xs">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Users className="w-3 h-3" />
                  <span>{token.accounts.authorized.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Droplets className="w-3 h-3" />
                  <span>{token.num_liquidity_pools} pools</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}
