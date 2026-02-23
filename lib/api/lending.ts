import { axiosClient, toApiError } from "../api"

export interface AssetRef {
  code: string
  issuer: string
}

export interface CollateralConfig {
  asset: AssetRef
  collateralFactor: string
}

export interface LendingPool {
  _id: string
  asset: AssetRef
  totalSupply: string
  totalBorrow: string
  supplyRate: string
  borrowRate: string
  collateralFactor: string
  collateralAssets?: CollateralConfig[]
  active: boolean
  createdAt?: string
  updatedAt?: string
}

export interface SupplyPosition {
  _id: string
  userId: string
  poolId: string | LendingPool
  amount: string
  accruedInterest?: string
  createdAt?: string
  updatedAt?: string
}

export interface BorrowPosition {
  _id: string
  userId: string
  poolId: string | LendingPool
  borrowType?: "small" | "big_business"
  rateYearly?: string
  rateMonthly?: string
  collateralAsset: AssetRef
  collateralAmount: string
  borrowedAmount: string
  borrowedAsset: AssetRef
  accruedInterest?: string
  healthFactor?: string
  liquidatedAt?: string | null
  totalDebt?: string
  createdAt?: string
  updatedAt?: string
}

export interface ListPoolsParams {
  active?: boolean
}

export interface ListPoolsResponse {
  data: LendingPool[]
}

export interface SupplyPayload {
  amount: string
  userId?: string
}

export interface WithdrawPayload {
  amount: string
  userId?: string
}

export interface BorrowPayload {
  collateralAsset: AssetRef
  collateralAmount: string
  borrowAmount: string
  userId?: string
}

export interface GetPositionsResponse {
  supply: SupplyPosition[]
  borrow: BorrowPosition[]
}

export interface CreditScoreResponse {
  score: number | null
  canBorrow: boolean
  reason?: string
}

export interface FeeDestinationResponse {
  platformFeePublicKey: string | null
}

export const listPools = async (params: ListPoolsParams = {}) => {
  try {
    const activeOnly = params.active !== false
    const { data } = await axiosClient.get<ListPoolsResponse>("/lending/pools", {
      params: { active: activeOnly },
    })
    return data
  } catch (error) {
    throw toApiError(error)
  }
}

export const getPool = async (poolId: string) => {
  try {
    const { data } = await axiosClient.get<LendingPool>(`/lending/pools/${poolId}`)
    return data
  } catch (error) {
    throw toApiError(error)
  }
}

export const supply = async (poolId: string, body: SupplyPayload) => {
  try {
    const { data } = await axiosClient.post<{ position: SupplyPosition; feeAmount: string }>(
      `/lending/pools/${poolId}/supply`,
      body
    )
    return data
  } catch (error) {
    throw toApiError(error)
  }
}

export const withdraw = async (poolId: string, body: WithdrawPayload) => {
  try {
    const { data } = await axiosClient.post<{
      position: string
      withdrawn: string
      amountToUser: string
      feeAmount: string
    }>(`/lending/pools/${poolId}/withdraw`, body)
    return data
  } catch (error) {
    throw toApiError(error)
  }
}

export const borrow = async (poolId: string, body: BorrowPayload) => {
  try {
    const { data } = await axiosClient.post<{
      position: BorrowPosition
      feeAmount: string
      borrowType?: string
      rateYearlyPercent?: number
      rateMonthlyPercent?: number
      creditScore?: number
    }>(`/lending/pools/${poolId}/borrow`, body)
    return data
  } catch (error) {
    throw toApiError(error)
  }
}

export const getPositions = async (userId?: string) => {
  try {
    const params = userId ? { userId } : {}
    const { data } = await axiosClient.get<GetPositionsResponse>("/lending/positions", { params })
    return data
  } catch (error) {
    throw toApiError(error)
  }
}

export const repay = async (borrowPositionId: string, body: { amount: string }) => {
  try {
    const { data } = await axiosClient.post<{
      position: BorrowPosition
      repaid: string
      principalRepaid?: string
      interestRepaid?: string
    }>(`/lending/positions/${borrowPositionId}/repay`, body)
    return data
  } catch (error) {
    throw toApiError(error)
  }
}

export const liquidate = async (
  borrowPositionId: string,
  body: { repayAmount: string; userId?: string }
) => {
  try {
    const { data } = await axiosClient.post<{
      repaid: string
      collateralReward: string
      collateralAsset: AssetRef
      liquidatorUserId: string
      liquidationFee?: string
    }>(`/lending/positions/${borrowPositionId}/liquidate`, body)
    return data
  } catch (error) {
    throw toApiError(error)
  }
}

export const getPrices = async (assets?: string[]) => {
  try {
    const params = assets?.length ? { assets: assets.join(",") } : {}
    const { data } = await axiosClient.get<Record<string, string>>("/lending/prices", { params })
    return data
  } catch (error) {
    throw toApiError(error)
  }
}

export const getCreditScore = async (userId?: string) => {
  try {
    const params = userId ? { userId } : {}
    const { data } = await axiosClient.get<CreditScoreResponse>("/lending/credit-score", { params })
    return data
  } catch (error) {
    throw toApiError(error)
  }
}

export const setCreditScore = async (body: { userId: string; score: number }) => {
  try {
    const { data } = await axiosClient.post<{ userId: string; score: number }>("/lending/credit-score", body)
    return data
  } catch (error) {
    throw toApiError(error)
  }
}

export const getFeeDestination = async () => {
  try {
    const { data } = await axiosClient.get<FeeDestinationResponse>("/lending/fee-destination")
    return data
  } catch (error) {
    throw toApiError(error)
  }
}
