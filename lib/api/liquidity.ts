import { axiosClient, toApiError } from "../api"
import type { ILiquidityPool } from "../types"
import { registerPair } from "./pairs"
import { cachedRequest, createRequestKey } from "./request-cache"

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

export interface UserToken {
  code: string
  issuer: string | null
  amount: number
  assetType: string
}

export interface GetUserTokensResponse {
  publicKey: string
  tokens: UserToken[]
  cached: boolean
}

export interface PlatformPool {
  poolId: string
  baseToken: string
  quoteToken: string
  verified: boolean
  source: string
  createdAt: string
  pool: ILiquidityPool | null
  error?: string
}

export interface GetPlatformPoolsResponse {
  pools: PlatformPool[]
  count: number
}

export interface PoolExistsError {
  message: string
  poolExists: boolean
  poolId: string
  existingPool?: ILiquidityPool
  suggestion: string
}

export const createLiquidityPool = async (payload: CreateLiquidityPoolPayload) => {
  try {
    const { data } = await axiosClient.post<LiquidityTransactionResponse>("/liquidity-pools", payload)
    
    // Register the pair in the DEX registry after pool creation
    // Note: This is now handled on the backend, but keeping for backward compatibility
    if (data.poolId) {
      try {
        await registerPair({
          baseToken: payload.tokenA.code,
          quoteToken: payload.tokenB.code,
          poolId: data.poolId,
          source: "internal",
        })
      } catch (pairError) {
        // Log but don't fail the pool creation if pair registration fails
        console.warn("Failed to register pair after pool creation:", pairError)
      }
    }
    
    return data
  } catch (error: any) {
    // Check if this is a pool exists error (409 status)
    if (error.response?.status === 409 && error.response?.data?.poolExists) {
      const poolError: PoolExistsError = error.response.data
      throw poolError
    }
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

export const listLiquidityPools = async (params: ListLiquidityPoolsParams = {}, options?: { skipCache?: boolean }) => {
  const cacheKey = createRequestKey("/liquidity-pools", params)
  
  return cachedRequest(
    cacheKey,
    async () => {
      try {
        const { data } = await axiosClient.get<ListLiquidityPoolsResponse>("/liquidity-pools", { params })
        return data
      } catch (error) {
        throw toApiError(error)
      }
    },
    {
      ttl: 2 * 60 * 1000, // 2 minutes - pools change moderately
      skipCache: options?.skipCache,
    }
  )
}

/** Fetches all liquidity pools by following pagination until no more pages. Use for LP page list and search. */
export const listAllLiquidityPools = async (options?: { skipCache?: boolean }): Promise<ListLiquidityPoolsResponse> => {
  const limit = 100
  const all: ILiquidityPool[] = []
  let cursor: string | undefined
  let hasMore = true
  while (hasMore) {
    const res = await listLiquidityPools({ limit, cursor }, { skipCache: options?.skipCache ?? true })
    all.push(...res.data)
    hasMore = res.pagination?.hasMore === true && res.pagination?.nextCursor != null
    cursor = res.pagination?.nextCursor ?? undefined
  }
  return {
    data: all,
    pagination: {
      limit: all.length,
      nextCursor: null,
      hasMore: false,
    },
  }
}

export const getLiquidityPoolById = async (poolId: string, options?: { skipCache?: boolean }) => {
  const cacheKey = createRequestKey(`/liquidity-pools/${poolId}`, {})
  
  return cachedRequest(
    cacheKey,
    async () => {
      try {
        const { data } = await axiosClient.get<ILiquidityPool>(`/liquidity-pools/${poolId}`)
        return data
      } catch (error) {
        throw toApiError(error)
      }
    },
    {
      ttl: 1 * 60 * 1000, // 1 minute - pool details change more frequently
      skipCache: options?.skipCache,
    }
  )
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

export const getUserTokens = async (publicKey: string) => {
  try {
    const { data } = await axiosClient.get<GetUserTokensResponse>("/liquidity-pools/user-tokens", {
      params: { publicKey },
    })
    return data
  } catch (error) {
    throw toApiError(error)
  }
}

export const getPlatformPools = async (options?: { skipCache?: boolean }) => {
  const cacheKey = createRequestKey("/liquidity-pools/platform-pools", {})
  
  return cachedRequest(
    cacheKey,
    async () => {
      try {
        const { data } = await axiosClient.get<GetPlatformPoolsResponse>("/liquidity-pools/platform-pools")
        return data
      } catch (error) {
        throw toApiError(error)
      }
    },
    {
      ttl: 2 * 60 * 1000, // 2 minutes
      skipCache: options?.skipCache,
    }
  )
}

export interface QuoteAddLiquidityParams {
  poolId: string
  amountA: string
}

export interface QuoteAddLiquidityResponse {
  success: boolean
  amountA: string
  amountB: string
  poolRatio: number
  assetA: string
  assetB: string
  platformFee: string
  baseFee: string
  totalFee: string
}

export const quoteAddLiquidity = async (params: QuoteAddLiquidityParams) => {
  try {
    const { data } = await axiosClient.get<QuoteAddLiquidityResponse>("/liquidity-pools/quote", {
      params,
    })
    return data
  } catch (error) {
    throw toApiError(error)
  }
}