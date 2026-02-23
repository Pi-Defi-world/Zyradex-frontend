import { axiosClient, toApiError } from "../api"
import { cachedRequest, createRequestKey } from "./request-cache"

export interface TokenRecord {
  _id: string
  name: string
  assetCode: string
  issuer: string
  distributor: string
  description: string
  totalSupply: number
  homeDomain?: string
  createdAt: string
  updatedAt: string
}

export interface FetchTokensResponse {
  success: boolean
  tokens: TokenRecord[]
}

export interface EstablishTrustlinePayload {
  userSecret: string
  assetCode: string
  issuer: string
  limit?: string | number
}

export interface TrustlineResponse {
  success: boolean
  result: unknown
}

export interface MintTokenPayload {
  distributorSecret: string
  assetCode: string
  totalSupply: number
  name: string
  description: string
  homeDomain?: string
}

export interface BurnTokenPayload {
  holderSecret: string
  assetCode: string
  issuer: string
  amount: string | number
}

export interface BurnTokenResponse {
  message: string
  txHash: string
}

export interface MintFeeResponse {
  success: boolean
  fee: {
    platformFee: string
    platformFeeStroops: string
    baseFee: string
    totalFee: string
    feeRecipient: string
  }
}

export const getMintFee = async () => {
  try {
    const { data } = await axiosClient.get<MintFeeResponse>("/tokens/mint-fee")
    return data
  } catch (error) {
    throw toApiError(error)
  }
}

export const fetchTokens = async (options?: { skipCache?: boolean }) => {
  const cacheKey = createRequestKey("/tokens", {})
  
  return cachedRequest(
    cacheKey,
    async () => {
      try {
        const { data } = await axiosClient.get<FetchTokensResponse>("/tokens")
        return data
      } catch (error) {
        throw toApiError(error)
      }
    },
    {
      ttl: 10 * 60 * 1000, // 10 minutes - tokens rarely change
      skipCache: options?.skipCache,
    }
  )
}

export const establishTrustline = async (payload: EstablishTrustlinePayload) => {
  try {
    const { data } = await axiosClient.post<TrustlineResponse>("/tokens/trustline", payload)
    return data
  } catch (error) {
    throw toApiError(error)
  }
}

export const mintToken = async (payload: MintTokenPayload) => {
  try {
    const { data } = await axiosClient.post<TokenRecord>("/tokens/mint", payload)
    return data
  } catch (error) {
    throw toApiError(error)
  }
}

export const burnToken = async (payload: BurnTokenPayload) => {
  try {
    const { data } = await axiosClient.post<BurnTokenResponse>("/tokens/burn", payload)
    return data
  } catch (error) {
    throw toApiError(error)
  }
}
