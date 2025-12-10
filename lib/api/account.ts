import { axiosClient, toApiError } from "../api"

export interface CreateWalletResponse {
  publicKey: string
  secret: string
  seedResult: {
    success: boolean
    transactionHash: string
    accountCreated: boolean
    amount: string
  }
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
  destinationAsset?: string
  destinationAmount?: string
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

export const createWallet = async () => {
  try {
    const { data } = await axiosClient.post<CreateWalletResponse>("/account/create-wallet")
    return data
  } catch (error) {
    throw toApiError(error)
  }
}

export const getAccountBalances = async (publicKey: string, refresh?: boolean) => {
  try {
    const { data } = await axiosClient.get<AccountBalancesResponse>(`/account/balance/${publicKey}`, {
      params: refresh ? { refresh: 'true' } : undefined
    })
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

export interface AccountTransactionsParams {
  publicKey: string
  limit?: number
  cursor?: string
  order?: "asc" | "desc"
  refresh?: boolean
}

export interface AccountTransaction {
  id: string
  hash: string
  ledger: number
  createdAt: string
  sourceAccount: string
  fee: string
  feeAccount?: string
  operationCount: number
  successful: boolean
  paging_token?: string
  memo?: string
  memoType?: string
  operations?: Array<{
    id: string
    type: string
    sourceAccount: string
    createdAt: string
  }>
}

export interface PaginatedTransactions {
  data: AccountTransaction[]
  pagination: {
    limit: number
    nextCursor: string | null
    hasMore: boolean
    order: "asc" | "desc"
  }
  cached?: boolean
}

export const getAccountTransactions = async (params: AccountTransactionsParams) => {
  try {
    const { publicKey, refresh, ...query } = params
    const { data } = await axiosClient.get<PaginatedTransactions>(`/account/transactions/${publicKey}`, {
      params: refresh ? { ...query, refresh: 'true' } : query,
    })
    return data
  } catch (error) {
    throw toApiError(error)
  }
}

export interface SendPaymentPayload {
  userSecret: string
  destination: string
  asset: { code: string; issuer?: string }
  amount: string
  memo?: string
}

export interface SendPaymentResponse {
  success: boolean
  transactionHash?: string
  ledger?: number
  message?: string
  receiverNeedsTrustline?: boolean
}

export const sendPayment = async (payload: SendPaymentPayload) => {
  try {
    const { data } = await axiosClient.post<SendPaymentResponse>("/account/send", payload)
    return data
  } catch (error) {
    throw toApiError(error)
  }
}