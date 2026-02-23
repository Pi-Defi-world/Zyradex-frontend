 import { axiosClient, toApiError } from "../api"

export interface TokenAsset {
  code: string
  issuer: string
}

export interface Launch {
  _id: string
  projectId: string
  projectAppUrl?: string
  teamVestingSchedule?: string
  tokenAsset: TokenAsset
  T_available: string
  participationWindowStart?: string
  participationWindowEnd?: string
  stakeDurationDays: number
  allocationDesign: 1 | 2
  status: "draft" | "participation_open" | "participation_closed" | "allocation_running" | "tge_open"
  escrowPublicKey?: string
  escrowLocked?: boolean
  poolId?: string
  tgeAt?: string
  listingPrice?: string
  PiPowerBaseline?: string
  createdBeforeCutoff?: boolean
  isEquityStyle?: boolean
  dividendPolicy?: { type: string; value: string; frequency: string }
  createdAt?: string
  updatedAt?: string
}

export interface Participation {
  launchId: string
  userId: string
  committedPi?: string
  piPower?: string
  allocatedTokens?: string
  effectivePrice?: string
  tier?: string
  [key: string]: unknown
}

export interface PiPowerResponse {
  stakedPi?: string
  sumStakedPi?: string
  piPower?: string
  committedPi?: string
  canCommit?: string
  qualifiesBaseline?: boolean
  [key: string]: unknown
}

export interface ListLaunchesParams {
  limit?: number
  status?: string
}

export interface ListLaunchesResponse {
  data: Launch[]
}

export interface CommitPiPayload {
  committedPi: string
  userId?: string
}

export interface CommitPiResponse {
  participation: Participation
}

export interface RecordEngagementPayload {
  userId?: string
  eventType: string
  payload?: Record<string, unknown>
}

export const listLaunches = async (params: ListLaunchesParams = {}) => {
  try {
    const { data } = await axiosClient.get<ListLaunchesResponse>("/launchpad/launches", { params })
    return data
  } catch (error) {
    throw toApiError(error)
  }
}

export const getLaunch = async (launchId: string) => {
  try {
    const { data } = await axiosClient.get<Launch>(`/launchpad/launches/${launchId}`)
    return data
  } catch (error) {
    throw toApiError(error)
  }
}

export const getMyPiPower = async (launchId: string, userId?: string) => {
  try {
    const params = userId ? { userId } : {}
    const { data } = await axiosClient.get<PiPowerResponse>(`/launchpad/launches/${launchId}/pi-power`, { params })
    return data
  } catch (error) {
    throw toApiError(error)
  }
}

export const commitPi = async (launchId: string, body: CommitPiPayload) => {
  try {
    const { data } = await axiosClient.post<CommitPiResponse>(`/launchpad/launches/${launchId}/commit`, body)
    return data
  } catch (error) {
    throw toApiError(error)
  }
}

export const recordEngagement = async (launchId: string, body: RecordEngagementPayload) => {
  try {
    await axiosClient.post(`/launchpad/launches/${launchId}/engagement`, body)
  } catch (error) {
    throw toApiError(error)
  }
}

export const transitionLaunchStatus = async (launchId: string, body: { status: string }) => {
  try {
    const { data } = await axiosClient.patch<Launch>(`/launchpad/launches/${launchId}/status`, body)
    return data
  } catch (error) {
    throw toApiError(error)
  }
}

export const closeParticipationWindow = async (launchId: string) => {
  try {
    const { data } = await axiosClient.post<Launch>(`/launchpad/launches/${launchId}/close-window`)
    return data
  } catch (error) {
    throw toApiError(error)
  }
}

export const runAllocation = async (launchId: string) => {
  try {
    const { data } = await axiosClient.post<Launch>(`/launchpad/launches/${launchId}/run-allocation`)
    return data
  } catch (error) {
    throw toApiError(error)
  }
}

export const createEscrow = async (launchId: string) => {
  try {
    const { data } = await axiosClient.post<{ escrowPublicKey?: string; [key: string]: unknown }>(
      `/launchpad/launches/${launchId}/escrow`
    )
    return data
  } catch (error) {
    throw toApiError(error)
  }
}

export const executeTge = async (launchId: string, body: { escrowSecret: string }) => {
  try {
    const { data } = await axiosClient.post<Launch>(`/launchpad/launches/${launchId}/execute-tge`, body)
    return data
  } catch (error) {
    throw toApiError(error)
  }
}
