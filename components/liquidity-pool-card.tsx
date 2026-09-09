"use client"

import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { ILiquidityPool } from "@/lib/types"
import { ExternalLink, Droplets, TrendingUp } from "lucide-react"

interface LiquidityPoolCardProps {
  pool: ILiquidityPool
  index?: number
}

export function LiquidityPoolCard({ pool, index = 0 }: LiquidityPoolCardProps) {
  // Helper to parse asset string to { code, issuer }
  function parseAsset(asset: string) {
    if (asset === "native") {
      return { code: "Test-Pi", issuer: "" }
    }
    const [code, issuer] = asset.split(":")
    return { code, issuer }
  }

  const [reserveA, reserveB] = pool.reserves
  const assetA = reserveA ? parseAsset(reserveA.asset) : { code: "?", issuer: "" }
  const assetB = reserveB ? parseAsset(reserveB.asset) : { code: "?", issuer: "" }
  const amountA = reserveA ? Number.parseFloat(reserveA.amount) : 0
  const amountB = reserveB ? Number.parseFloat(reserveB.amount) : 0

  const pair = `${assetA.code}/${assetB.code}`
  const liquidity = Number.parseFloat(pool.total_shares)
  const trustlines = Number.parseFloat(pool.total_trustlines)

  const txLink = pool._links?.transactions?.href
  const opsLink = pool._links?.operations?.href
  const selfLink = pool._links?.self?.href

  // Calculate TVL (Total Value Locked) as sum of reserves
  const tvl = amountA + amountB

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
      <Card className="p-2 bg-card border-border hover:border-primary/50 transition-all duration-300 cursor-pointer hover:shadow-lg group">
        <div className="flex items-start justify-between mb-4 relative ">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
              <Droplets className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-xl text-foreground">{pair}</h3>
              <p className="text-xs text-muted-foreground">Fee: {pool.fee_bp / 100}%</p>
            </div>
          </div>
          {trustlines > 100 && (
            <Badge variant="secondary" className="flex items-center gap-1 absolute top-1 right-1">
              <TrendingUp className="w-3 h-3" />
              Popular
            </Badge>
          )}
        </div>

        <div className=" mb-1">
          <div className="flex justify-between items-center rounded-lg bg-muted/50">
            <span className="text-sm font-medium text-muted-foreground">{assetA.code}</span>
            <span className="text-sm font-bold text-foreground">
              {amountA.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex justify-between items-center rounded-lg bg-muted/50">
            <span className="text-sm font-medium text-muted-foreground">{assetB.code}</span>
            <span className="text-sm font-bold text-foreground">
              {amountB.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <div className="border-t border-border pt-4 space-y-2 mb-4">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Total Liquidity</span>
            <span className="text-sm font-semibold text-foreground">
              {liquidity.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Trustlines</span>
            <span className="text-sm font-semibold text-foreground">{trustlines.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">TVL</span>
            <span className="text-sm font-semibold text-primary">
              {tvl.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </span> 
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {selfLink && (
            <a
              href={selfLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-xs text-primary hover:underline"
            >
              View Pool
              <ExternalLink className="ml-1 h-3 w-3" />
            </a>
          )}
          {txLink && (
            <a
              href={txLink.replace("{?cursor,limit,order}", "")}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground hover:underline"
            >
              Transactions
              <ExternalLink className="ml-1 h-3 w-3" />
            </a>
          )}
          {opsLink && (
            <a
              href={opsLink.replace("{?cursor,limit,order}", "")}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground hover:underline"
            >
              Operations
              <ExternalLink className="ml-1 h-3 w-3" />
            </a>
          )}
        </div>

        {/* <Button
          className="w-full bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20"
          variant="outline"
        >
          Add Liquidity
        </Button> */}
      </Card>
    </motion.div>
  )
}
