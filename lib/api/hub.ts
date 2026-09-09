/**
 * Hub API Client
 *
 * API functions for interacting with Hub contracts through the backend.
 * Used when HUB_MODE is enabled.
 */

import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_BASE_URL) {
  throw new Error("NEXT_PUBLIC_API_URL env var is required");
}

const api = axios.create({
  baseURL: `${API_BASE_URL}/v1/hub`,
  timeout: 30000,
});

// Add auth interceptor (same as existing api.ts)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("dex_user_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Types ───────────────────────────────────────────────────────────

export interface HubPool {
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

export interface HubSwapQuote {
  amountOut: number;
  minAmountOut: number;
  poolAddress: string;
  poolType: string;
  feeBps: number;
  source: "hub";
}

export interface HubSwapResult {
  amountOut: number;
  txHash: string;
  source: "hub";
}

// ─── API Functions ───────────────────────────────────────────────────

/**
 * Check if Hub mode is available.
 */
export async function checkHubAvailable(): Promise<boolean> {
  try {
    const res = await api.get("/status");
    return res.data.available === true;
  } catch {
    return false;
  }
}

/**
 * Get all Hub pools.
 */
export async function getHubPools(): Promise<HubPool[]> {
  const res = await api.get("/pools");
  return res.data.pools;
}

/**
 * Get Hub pool details with reserves.
 */
export async function getHubPoolDetails(poolId: number): Promise<HubPool> {
  const res = await api.get(`/pools/${poolId}`);
  return res.data;
}

/**
 * Get swap quote from Hub contracts.
 */
export async function getHubSwapQuote(params: {
  tokenA: string;
  tokenB: string;
  amount: number;
  slippagePercent?: number;
}): Promise<HubSwapQuote> {
  const res = await api.get("/swap/quote", { params });
  return res.data;
}

/**
 * Execute swap on Hub contracts.
 */
export async function executeHubSwap(params: {
  poolAddress: string;
  tokenIn: string;
  amountIn: number;
  minAmountOut: number;
  traderSecret: string;
}): Promise<HubSwapResult> {
  const res = await api.post("/swap/execute", params);
  return res.data;
}
