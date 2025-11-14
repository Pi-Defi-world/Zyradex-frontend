import { axiosClient, toApiError } from "../api"

export interface PairRecord {
  _id: string
  baseToken: string
  quoteToken: string
  poolId: string
  verified: boolean
  source: "internal" | "external"
  createdAt: string
  updatedAt: string
}

export interface RegisterPairPayload {
  baseToken: string
  quoteToken: string
  poolId: string
  source: "internal" | "external"
}

export interface RegisterPairResponse {
  success: boolean
  pair: PairRecord
}

export interface VerifyPairPayload {
  poolId: string
  verified?: boolean
}

export interface VerifyPairResponse {
  success: boolean
  pair: PairRecord
}

export interface ListPairsResponse {
  success: boolean
  pairs: PairRecord[]
}

export interface DeletePairResponse {
  success: boolean
  message: string
}

export const registerPair = async (payload: RegisterPairPayload) => {
  try {
    const { data } = await axiosClient.post<RegisterPairResponse>("/pairs", payload)
    return data
  } catch (error) {
    throw toApiError(error)
  }
}

export const verifyPair = async (payload: VerifyPairPayload) => {
  try {
    const { data } = await axiosClient.patch<VerifyPairResponse>("/pairs/verify", payload)
    return data
  } catch (error) {
    throw toApiError(error)
  }
}

export const listPairs = async () => {
  try {
    const { data } = await axiosClient.get<ListPairsResponse>("/pairs")
    return data
  } catch (error) {
    throw toApiError(error)
  }
}

export const deletePair = async (poolId: string) => {
  try {
    const { data } = await axiosClient.delete<DeletePairResponse>(`/pairs/${encodeURIComponent(poolId)}`)
    return data
  } catch (error) {
    throw toApiError(error)
  }
}
