import { axiosClient, toApiError } from "../api"
import type { AdminUser } from "./auth"

export interface ImportAccountPayload {
  mnemonic?: string
  secret?: string
}

export interface ImportAccountResponse {
  publicKey: string
  secret: string
}

export interface AccountBalanceEntry {
  assetType: string
  assetCode: string
  assetIssuer: string | null
  asset: string
  amount: number
  raw: string
}

export interface AccountBalancesResponse {
  publicKey: string
  balances: AccountBalanceEntry[]
}

export interface AccountOperationsParams {
  publicKey: string
  limit?: number
  cursor?: string
  order?: "asc" | "desc"
}

export interface AccountOperation {
  id: string
  createdAt: string
  type: string
  source: string
  transactionHash: string
  action: string
  amount?: string
  asset?: string
  from?: string
  to?: string
  funder?: string
  account?: string
  startingBalance?: string
  limit?: string
  selling?: string
  buying?: string
  price?: string
  signer?: string | null
  masterWeight?: string | null
  lowThreshold?: string | null
  medThreshold?: string | null
  highThreshold?: string | null
  destination?: string
  details?: unknown
  pagingToken?: string
}

export interface PaginatedOperations {
  data: AccountOperation[]
  pagination: {
    limit: number
    nextCursor: string | null
    hasMore: boolean
    order: "asc" | "desc"
  }
}

export interface LinkWalletResponse {
  user: AdminUser
}

export const linkWallet = async (publicKey: string): Promise<LinkWalletResponse> => {
  try {
    const { data } = await axiosClient.post<LinkWalletResponse>("/account/link-wallet", { publicKey })
    return data
  } catch (error) {
    throw toApiError(error)
  }
}

export const importAccount = async (payload: ImportAccountPayload) => {
  try {
    const { data } = await axiosClient.post<ImportAccountResponse>("/account/import", payload)
    return data
  } catch (error) {
    throw toApiError(error)
  }
}

export const getAccountBalances = async (publicKey: string) => {
  try {
    const { data } = await axiosClient.get<AccountBalancesResponse>(`/account/balance/${publicKey}`)
    return data
  } catch (error) {
    throw toApiError(error)
  }
}

export const getAccountOperations = async (params: AccountOperationsParams) => {
  try {
    const { publicKey, ...query } = params
    const { data } = await axiosClient.get<PaginatedOperations>(`/account/operations/${publicKey}`, {
      params: query,
    })
    return data
  } catch (error) {
    throw toApiError(error)
  }
}
