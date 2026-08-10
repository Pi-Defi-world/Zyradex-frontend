import { axiosClient, toApiError } from "../api"

export interface CreateSellOfferPayload {
  userSecret: string
  selling: string
  buying: string
  amount: string | number
  price: string | number
}

export interface CreateBuyOfferPayload {
  userSecret: string
  selling: string
  buying: string
  buyAmount: string | number
  price: string | number
}

export interface MarketSellOrderPayload {
  userSecret: string
  selling: string
  buying: string
  amount: string | number
}

export interface MarketBuyOrderPayload {
  userSecret: string
  selling: string
  buying: string
  buyAmount: string | number
}

export interface CancelOfferPayload {
  userSecret: string
  selling: string
  buying: string
  offerId: string | number
}

export interface TradeResponse {
  success: boolean
  result: unknown
}

export const createSellOffer = async (payload: CreateSellOfferPayload) => {
  try {
    const { data } = await axiosClient.post<TradeResponse>("/trade/sell", payload)
    return data
  } catch (error) {
    throw toApiError(error)
  }
}

export const createBuyOffer = async (payload: CreateBuyOfferPayload) => {
  try {
    const { data } = await axiosClient.post<TradeResponse>("/trade/buy", payload)
    return data
  } catch (error) {
    throw toApiError(error)
  }
}

export const cancelOffer = async (payload: CancelOfferPayload) => {
  try {
    const { data } = await axiosClient.post<TradeResponse>("/trade/cancel", payload)
    return data
  } catch (error) {
    throw toApiError(error)
  }
}

export const createMarketSellOrder = async (payload: MarketSellOrderPayload) => {
  try {
    const { data } = await axiosClient.post<TradeResponse>("/trade/market-sell", payload)
    return data
  } catch (error) {
    throw toApiError(error)
  }
}

export const createMarketBuyOrder = async (payload: MarketBuyOrderPayload) => {
  try {
    const { data } = await axiosClient.post<TradeResponse>("/trade/market-buy", payload)
    return data
  } catch (error) {
    throw toApiError(error)
  }
}
