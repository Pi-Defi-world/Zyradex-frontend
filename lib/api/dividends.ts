import { axiosClient, toApiError } from "../api"

export interface PayoutAsset {
  code: string
  issuer: string
}

export interface DividendRound {
  _id: string
  launchId: string
  recordAt: string
  status: "pending" | "snapshot_done" | "payout_done"
  payoutAsset: PayoutAsset
  totalPayoutAmount: string
  totalEligibleSupply?: string
  eligibleHoldersCount?: number
  createdAt?: string
  updatedAt?: string
}

export interface DividendHolderSnapshot {
  _id: string
  dividendRoundId: string
  publicKey: string
  userId?: string
  tokenBalance: string
  shareOfSupply: string
  payoutAmount: string
  claimedAt?: string | null
  txHash?: string
}

export interface CreateDividendRoundPayload {
  recordAt?: string
  totalPayoutAmount: string
}

export interface GetHoldersParams {
  limit?: number
  cursor?: string
}

export interface GetHoldersResponse {
  data: DividendHolderSnapshot[]
  nextCursor?: string
}

export interface RecordClaimPayload {
  publicKey: string
  txHash: string
}

export const createDividendRound = async (launchId: string, body: CreateDividendRoundPayload) => {
  try {
    const { data } = await axiosClient.post<DividendRound>(
      `/launchpad/launches/${launchId}/dividend-rounds`,
      body
    )
    return data
  } catch (error) {
    throw toApiError(error)
  }
}

export const runSnapshot = async (roundId: string) => {
  try {
    const { data } = await axiosClient.post<{ totalEligibleSupply: string; eligibleHoldersCount: number }>(
      `/dividend-rounds/${roundId}/snapshot`
    )
    return data
  } catch (error) {
    throw toApiError(error)
  }
}

export const getRound = async (roundId: string) => {
  try {
    const { data } = await axiosClient.get<DividendRound>(`/dividend-rounds/${roundId}`)
    return data
  } catch (error) {
    throw toApiError(error)
  }
}

export const getHolders = async (roundId: string, params: GetHoldersParams = {}) => {
  try {
    const { data } = await axiosClient.get<GetHoldersResponse>(`/dividend-rounds/${roundId}/holders`, {
      params: { limit: params.limit ?? 50, cursor: params.cursor },
    })
    return data
  } catch (error) {
    throw toApiError(error)
  }
}

export const recordClaim = async (roundId: string, body: RecordClaimPayload) => {
  try {
    const { data } = await axiosClient.post<DividendHolderSnapshot>(`/dividend-rounds/${roundId}/claim`, body)
    return data
  } catch (error) {
    throw toApiError(error)
  }
}
