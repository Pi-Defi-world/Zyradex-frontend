import { axiosClient, toApiError } from "../api"

export interface OrderBookLevel {
  price: number
  amount: number
  seller: string
}

export interface OrderBookResponse {
  success: boolean
  book: {
    bids: OrderBookLevel[]
    asks: OrderBookLevel[]
  }
}

export interface OrderBookParams {
  base: string
  counter: string
}

export interface OfferRecord {
  id: string
  selling: unknown
  buying: unknown
  amount: number
  price: string
  last_modified_ledger: number
}

export interface OffersResponse {
  success: boolean
  offers: OfferRecord[]
}

export const getOrderBook = async (params: OrderBookParams) => {
  try {
    const { data } = await axiosClient.get<OrderBookResponse>("/market/orderbook", { params })
    return data
  } catch (error) {
    throw toApiError(error)
  }
}

export const getOffersByAccount = async (account: string) => {
  try {
    const { data } = await axiosClient.get<OffersResponse>(`/market/offers/${account}`)
    return data
  } catch (error) {
    throw toApiError(error)
  }
}
