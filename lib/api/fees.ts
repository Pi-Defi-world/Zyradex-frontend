import { axiosClient, toApiError } from "../api"

export interface FeeConfig {
  _id: string
  key: string
  description?: string
  value: unknown
  currency: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface FetchFeesResponse {
  success: boolean
  fees: FeeConfig[]
}

export interface CreateFeePayload {
  key: string
  description?: string
  value: unknown
  currency?: string
  isActive?: boolean
}

export interface CreateFeeResponse {
  success: boolean
  fee: FeeConfig
}

export interface UpdateFeePayload {
  description?: string
  value?: unknown
  currency?: string
  isActive?: boolean
}

export interface UpdateFeeResponse {
  success: boolean
  fee: FeeConfig
}

export const fetchFees = async () => {
  try {
    const { data } = await axiosClient.get<FetchFeesResponse>("/fees")
    return data
  } catch (error) {
    throw toApiError(error)
  }
}

export const createFee = async (payload: CreateFeePayload) => {
  try {
    const { data } = await axiosClient.post<CreateFeeResponse>("/fees", payload)
    return data
  } catch (error) {
    throw toApiError(error)
  }
}

export const updateFee = async (key: string, payload: UpdateFeePayload) => {
  try {
    const { data } = await axiosClient.put<UpdateFeeResponse>(`/fees/${encodeURIComponent(key)}`, payload)
    return data
  } catch (error) {
    throw toApiError(error)
  }
}
