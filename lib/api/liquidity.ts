import { axiosClient, toApiError } from "../api"
import type { ILiquidityPool } from "../types"

export interface AssetRef {
  code: string
  issuer: string
}

export interface CreateLiquidityPoolPayload {
  userSecret: string
  tokenA: AssetRef
  tokenB: AssetRef
  amountA: string | number
  amountB: string | number
}

export interface LiquidityTransactionResponse {
  poolId?: string
  liquidityTxHash?: string
  hash?: string
}

export interface ListLiquidityPoolsParams {
  limit?: number
  cursor?: string
}

export interface ListLiquidityPoolsResponse {
  data: ILiquidityPool[]
  pagination: {
    limit: number
    nextCursor: string | null
    hasMore: boolean
  }
}

export interface LiquidityRewardParams {
  userPublicKey: string
  poolId: string
}

export interface LiquidityRewardResponse {
  poolId: string
  userShares: number
  totalShares: number
  userPercentage: number
  rewards: Array<{ asset: string; earnedFees: string }>
}

export interface UserLiquidityPoolSummary {
  poolId: string
  userShare: string
  totalShares: string
  assets: string[]
  reserves: string[]
  fee: string
}

export interface AddLiquidityPayload {
  userSecret: string
  poolId: string
  amountA: string | number
  amountB: string | number
}

export interface WithdrawLiquidityPayload {
  userSecret: string
  poolId: string
  amount: string | number
}

export const createLiquidityPool = async (payload: CreateLiquidityPoolPayload) => {
  try {
    const { data } = await axiosClient.post<LiquidityTransactionResponse>("/liquidity-pools", payload)
    return data
  } catch (error) {
    throw toApiError(error)
  }
}

export const addLiquidity = async (payload: AddLiquidityPayload) => {
  try {
    const { data } = await axiosClient.post<LiquidityTransactionResponse>("/liquidity-pools/deposit", payload)
    return data
  } catch (error) {
    throw toApiError(error)
  }
}

export const withdrawLiquidity = async (payload: WithdrawLiquidityPayload) => {
  try {
    const { data } = await axiosClient.post<LiquidityTransactionResponse>("/liquidity-pools/withdraw", payload)
    return data
  } catch (error) {
    throw toApiError(error)
  }
}

export const listLiquidityPools = async (params: ListLiquidityPoolsParams = {}) => {
  try {
    const { data } = await axiosClient.get<ListLiquidityPoolsResponse>("/liquidity-pools", { params })
    return data
  } catch (error) {
    throw toApiError(error)
  }
}

export const getLiquidityPoolById = async (poolId: string) => {
  try {
    const { data } = await axiosClient.get<ILiquidityPool>(`/liquidity-pools/${poolId}`)
    return data
  } catch (error) {
    throw toApiError(error)
  }
}

export const getLiquidityReward = async (params: LiquidityRewardParams) => {
  try {
    const { data } = await axiosClient.get<LiquidityRewardResponse>("/liquidity-pools/rewards", { params })
    return data
  } catch (error) {
    throw toApiError(error)
  }
}

export const getUserLiquidityPools = async (userPublicKey: string) => {
  try {
    const { data } = await axiosClient.get<UserLiquidityPoolSummary[]>("/liquidity-pools/user-pools", {
      params: { userPublicKey },
    })
    return data
  } catch (error) {
    throw toApiError(error)
  }
}
