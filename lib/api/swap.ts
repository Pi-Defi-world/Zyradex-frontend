import { axiosClient, toApiError } from "../api"
import type { ILiquidityPool } from "../types"

export interface SwapQuoteParams {
  poolId: string
  from: string
  to: string
  amount: string | number
  slippagePercent?: number
}

export interface SwapQuoteResponse {
  success: boolean
  expectedOutput: string
  minOut: string
  slippagePercent: number
  fee: number
  poolId: string
}

export interface ExecuteSwapPayload {
  userSecret: string
  poolId: string
  from: { code: string; issuer?: string }
  to: { code: string; issuer?: string }
  sendAmount: string | number
  slippagePercent?: number
}

export interface ExecuteSwapResponse {
  success: boolean
  data: {
    success: boolean
    txHash: string
    expectedOutput: string
  }
}

export interface SwapTokenPayload {
  userSecret: string
  from: { code: string; issuer?: string }
  to: { code: string; issuer?: string }
  sendAmount: string | number
}

export interface SwapTokenResponse {
  hash: string
  expectedOutput: string
}

export interface PoolsForPairParams {
  tokenA: string
  tokenB: string
}

export interface PoolsForPairResponse {
  success: boolean
  pools: ILiquidityPool[]
}

export interface DistributeFeesPayload {
  poolId: string
}

export interface DistributeFeesResponse {
  success: boolean
  message: string
  distributed: {
    totalFeesA: string
    totalFeesB: string
  }
}

export const quoteSwap = async (params: SwapQuoteParams) => {
  try {
    const { data } = await axiosClient.get<SwapQuoteResponse>("/swap/quote", { params })
    return data
  } catch (error) {
    throw toApiError(error)
  }
}

export const executeSwap = async (payload: ExecuteSwapPayload) => {
  try {
    const { data } = await axiosClient.post<ExecuteSwapResponse>("/swap/execute", payload)
    return data
  } catch (error) {
    throw toApiError(error)
  }
}

export const swapToken = async (payload: SwapTokenPayload) => {
  try {
    const { data } = await axiosClient.post<SwapTokenResponse>("/swap", payload)
    return data
  } catch (error) {
    throw toApiError(error)
  }
}

export const getPoolsForPair = async (params: PoolsForPairParams) => {
  try {
    const { data } = await axiosClient.get<PoolsForPairResponse>("/swap/pools-for-pair", { params })
    return data
  } catch (error) {
    throw toApiError(error)
  }
}

export const distributeFees = async (payload: DistributeFeesPayload) => {
  try {
    const { data } = await axiosClient.post<DistributeFeesResponse>("/swap/distribute-fees", payload)
    return data
  } catch (error) {
    throw toApiError(error)
  }
}
