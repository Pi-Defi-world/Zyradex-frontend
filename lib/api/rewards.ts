import { axiosClient, toApiError } from "../api"

const REFERRAL_STORAGE_KEY = "zyradex_referral_ref"

export interface RewardsSummary {
  referralCode: string
  referralLink: string
  points: number
  successfulReferralsCount: number
  referrals: Array<{
    referredUserName: string
    createdAt: string
    status: string
    awardedPoints: number
  }>
  referredByUserId: string | null
}

export interface PointTransactionRecord {
  id: string
  type: string
  amount: number
  balanceAfter: number
  metadata?: Record<string, unknown>
  createdAt: string
}

export const getRewards = async (): Promise<RewardsSummary> => {
  try {
    const { data } = await axiosClient.get<RewardsSummary>("/rewards")
    return data
  } catch (error) {
    throw toApiError(error)
  }
}

export const getRewardsTransactions = async (
  params?: { limit?: number; offset?: number }
): Promise<{ transactions: PointTransactionRecord[]; total: number }> => {
  try {
    const { data } = await axiosClient.get<{
      transactions: PointTransactionRecord[]
      total: number
    }>("/rewards/transactions", { params })
    return data
  } catch (error) {
    throw toApiError(error)
  }
}

export const addReferrer = async (referralCode: string): Promise<{ success: boolean; message?: string }> => {
  try {
    const { data } = await axiosClient.post<{ success: boolean; message?: string }>(
      "/rewards/add-referrer",
      { referralCode }
    )
    return data
  } catch (error) {
    throw toApiError(error)
  }
}

/** Store referral code from URL for use during signin */
export const storeReferralRef = (ref: string) => {
  if (typeof window !== "undefined" && ref?.trim()) {
    sessionStorage.setItem(REFERRAL_STORAGE_KEY, ref.trim())
  }
}

/** Get stored referral ref and optionally clear it */
export const getStoredReferralRef = (clearAfter = false): string | null => {
  if (typeof window === "undefined") return null
  const ref = sessionStorage.getItem(REFERRAL_STORAGE_KEY)
  if (clearAfter && ref) {
    sessionStorage.removeItem(REFERRAL_STORAGE_KEY)
  }
  return ref
}
