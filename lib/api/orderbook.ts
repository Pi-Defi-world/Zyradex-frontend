import { axiosClient, toApiError } from "../api"
import { cachedRequest, createRequestKey } from "./request-cache"

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

export const getOrderBook = async (base: string, counter: string, options?: { skipCache?: boolean }) => {
  const cacheKey = createRequestKey("/market/orderbook", { base, counter })
  
  return cachedRequest(
    cacheKey,
    async () => {
      try {
        const { data } = await axiosClient.get<OrderBookResponse>("/market/orderbook", {
          params: { base, counter },
        })
        return data
      } catch (error) {
        throw toApiError(error)
      }
    },
    {
      ttl: 30 * 1000, // 30 seconds - market data changes frequently
      skipCache: options?.skipCache,
    }
  )
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

export interface Trade {
  id: string
  paging_token: string
  ledger_close_time: string
  offer_id: string
  base_account: string
  base_amount: string
  base_asset_type: string
  base_asset_code: string | null
  base_asset_issuer: string | null
  counter_account: string
  counter_amount: string
  counter_asset_type: string
  counter_asset_code: string | null
  counter_asset_issuer: string | null
  base_is_seller: boolean
  price: {
    n: number
    d: number
    price: number
  }
}

export interface TradesResponse {
  success: boolean
  trades: Trade[]
  count: number
}

export interface TradeAggregation {
  timestamp: string
  trade_count: number
  base_volume: string
  counter_volume: string
  avg: string
  high: string
  low: string
  open: string
  close: string
}

export interface TradeAggregationsResponse {
  success: boolean
  aggregations: TradeAggregation[]
  count: number
}

export const getTrades = async (base: string, counter: string, limit: number = 20) => {
  try {
    const { data } = await axiosClient.get<TradesResponse>("/market/trades", {
      params: { base, counter, limit },
    })
    return data
  } catch (error) {
    throw toApiError(error)
  }
}

export const getTradeAggregations = async (
  base: string,
  counter: string,
  resolution: number = 3600000,
  startTime?: string,
  endTime?: string,
  limit: number = 24
) => {
  try {
    const { data } = await axiosClient.get<TradeAggregationsResponse>("/market/trade-aggregations", {
      params: { base, counter, resolution, startTime, endTime, limit },
    })
    return data
  } catch (error) {
    throw toApiError(error)
  }
}

