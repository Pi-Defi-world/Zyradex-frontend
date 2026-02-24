import { axiosClient, toApiError } from "../api"

export interface AssetRef {
  code: string
  issuer: string
}

export interface SavingsProduct {
  _id: string
  asset: AssetRef
  termDays: number
  apy: string
  minAmount: string
  active: boolean
  source?: "lending_pool" | "incentive"
  lendingPoolId?: string
  createdAt?: string
  updatedAt?: string
}

export interface SavingsPosition {
  _id: string
  userId: string
  productId: string | SavingsProduct
  amount: string
  depositedAt?: string
  unlockedAt: string
  status: "locked" | "withdrawn"
  interestAccrued?: string
  accruedInterestSoFar?: string
  projectedInterestAtUnlock?: string
  createdAt?: string
  updatedAt?: string
}

export interface ListProductsParams {
  asset?: string
}

export interface ListProductsResponse {
  data: SavingsProduct[]
}

export interface SavingsTermOption {
  days: number
  apy: string
  unlockDate: string
}

export interface DepositPayload {
  productId: string
  amount: string
  userId?: string
  userSecret: string
  depositAddress?: string
  /** Selected term in days when product supports multiple terms (e.g. 40, 60, 90, 365, 730, 1825). */
  termDays?: number
}

export interface DepositResponse {
  position: SavingsPosition
  unlockedAt: string
  transactionHash?: string
  ledger?: number
  depositInstructions?: { asset: AssetRef; amount: string; sendToAddress: string | null; message: string }
}

export interface ListPositionsParams {
  userId?: string
  status?: "locked" | "withdrawn"
}

export interface ListPositionsResponse {
  data: SavingsPosition[]
}

export const getTermOptions = async () => {
  try {
    const { data } = await axiosClient.get<{ data: SavingsTermOption[] }>("/savings/term-options")
    return data.data
  } catch (error) {
    throw toApiError(error)
  }
}

export const listProducts = async (params: ListProductsParams = {}) => {
  try {
    const { data } = await axiosClient.get<ListProductsResponse>("/savings/products", {
      params: params.asset ? { asset: params.asset } : {},
    })
    return data
  } catch (error) {
    throw toApiError(error)
  }
}

export const createProduct = async (body: {
  asset: AssetRef
  termDays: number
  apy: string
  minAmount?: string
  active?: boolean
}) => {
  try {
    const { data } = await axiosClient.post<SavingsProduct>("/savings/products", body)
    return data
  } catch (error) {
    throw toApiError(error)
  }
}

export const deposit = async (body: DepositPayload) => {
  try {
    const { data } = await axiosClient.post<DepositResponse>("/savings/deposit", body)
    return data
  } catch (error) {
    throw toApiError(error)
  }
}

export const listPositions = async (params: ListPositionsParams = {}) => {
  try {
    const { data } = await axiosClient.get<ListPositionsResponse>("/savings/positions", {
      params: { userId: params.userId, status: params.status },
    })
    return data
  } catch (error) {
    throw toApiError(error)
  }
}

export const withdraw = async (positionId: string) => {
  try {
    const { data } = await axiosClient.post<{
      position: SavingsPosition
      principal: string
      interest: string
      totalPayout: string
      asset: AssetRef
      transactionHash?: string
      interestFee?: string
    }>(`/savings/positions/${positionId}/withdraw`)
    return data
  } catch (error) {
    throw toApiError(error)
  }
}
