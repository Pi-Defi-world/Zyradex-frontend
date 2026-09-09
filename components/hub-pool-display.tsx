"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

/**
 * Hub Pool Display
 *
 * Shows pools from the Zyrachain Protocol Hub contracts.
 * Displayed alongside or instead of legacy Stellar AMM pools.
 */

interface HubPool {
  poolId: number;
  poolAddress: string;
  tokenA: string;
  tokenB: string;
  poolType: "constant_product" | "stableswap";
  feeBps: number;
  reserveA?: string;
  reserveB?: string;
  totalShares?: string;
}

interface HubPoolDisplayProps {
  /** Called when user clicks "Trade" on a pool */
  onTrade?: (pool: HubPool) => void;
  /** Called when user clicks "Add Liquidity" */
  onAddLiquidity?: (pool: HubPool) => void;
}

export function HubPoolDisplay({ onTrade, onAddLiquidity }: HubPoolDisplayProps) {
  const [pools, setPools] = useState<HubPool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPools() {
      try {
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
        if (!API_BASE_URL) return;

        const res = await fetch(`${API_BASE_URL}/v1/hub/pools`);
        const data = await res.json();
        setPools(data.pools || []);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    fetchPools();
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-sm text-muted-foreground py-8">
        Failed to load Hub pools: {error}
      </div>
    );
  }

  if (pools.length === 0) {
    return (
      <div className="text-center text-sm text-muted-foreground py-8">
        No Hub pools found. Pools will appear here once created through the Pool Factory.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Hub Protocol Pools</h3>
        <Badge variant="secondary" className="text-xs">
          {pools.length} pools
        </Badge>
      </div>

      {pools.map((pool) => (
        <HubPoolCard
          key={pool.poolId}
          pool={pool}
          onTrade={() => onTrade?.(pool)}
          onAddLiquidity={() => onAddLiquidity?.(pool)}
        />
      ))}
    </div>
  );
}

function HubPoolCard({
  pool,
  onTrade,
  onAddLiquidity,
}: {
  pool: HubPool;
  onTrade?: () => void;
  onAddLiquidity?: () => void;
}) {
  const formatReserve = (val?: string) => {
    if (!val) return "—";
    const num = parseFloat(val);
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(2)}K`;
    return num.toFixed(2);
  };

  const feePercent = (pool.feeBps / 100).toFixed(2);

  return (
    <Card className="hover:border-emerald-500/50 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  {pool.tokenA.slice(0, 8)}/{pool.tokenB.slice(0, 8)}
                </span>
                <Badge
                  variant={pool.poolType === "stableswap" ? "default" : "secondary"}
                  className={
                    pool.poolType === "stableswap"
                      ? "bg-blue-500/20 text-blue-400"
                      : ""
                  }
                >
                  {pool.poolType === "stableswap" ? "Stable" : "CPMM"}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Fee: {feePercent}% · Pool #{pool.poolId}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Reserves</div>
              <div className="text-sm font-mono">
                {formatReserve(pool.reserveA)} / {formatReserve(pool.reserveB)}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={onAddLiquidity}
                className="text-xs"
              >
                + Liquidity
              </Button>
              <Button
                size="sm"
                onClick={onTrade}
                className="text-xs bg-emerald-600 hover:bg-emerald-700"
              >
                Trade
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
