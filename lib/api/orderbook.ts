import { axiosClient, toApiError } from "../api"

export interface OrderBookEntry {
  price: number
  amount: number
}

export interface OrderBook {
  bids: OrderBookEntry[]
  asks: OrderBookEntry[]
}

export interface OrderBookResponse {
  success: boolean
  book: OrderBook
}

export interface AssetSearchResult {
  asset_type: string
  asset_code: string
  asset_issuer: string
  num_accounts: number
  num_claimable_balances: number
  balances: string
  flags: {
    auth_required: boolean
    auth_revocable: boolean
    auth_immutable: boolean
    auth_clawback_enabled: boolean
  }
  paging_token: string
}

export interface AssetSearchResponse {
  success: boolean
  assets: AssetSearchResult[]
  count: number
}

export interface UserOffer {
  id: string
  selling: string
  buying: string
  amount: string
  price: string
}

export interface UserOffersResponse {
  success: boolean
  offers: UserOffer[]
}

export const getOrderBook = async (base: string, counter: string) => {
  try {
    const { data } = await axiosClient.get<OrderBookResponse>("/market/orderbook", {
      params: { base, counter },
    })
    return data
  } catch (error) {
    throw toApiError(error)
  }
}

export const getOffersByAccount = async (account: string) => {
  try {
    const { data } = await axiosClient.get<UserOffersResponse>(`/market/offers/${account}`)
    return data
  } catch (error) {
    throw toApiError(error)
  }
}

export const searchAssets = async (code: string, limit: number = 10) => {
  try {
    const { data } = await axiosClient.get<AssetSearchResponse>("/market/search-assets", {
      params: { code, limit },
    })
    return data
  } catch (error) {
    throw toApiError(error)
  }
}

