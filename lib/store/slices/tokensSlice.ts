import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import type { IAssetRecord, PaginatedResponse } from "@/lib/types"
import axios from "axios"
import { axiosClient } from "@/lib/api"

interface TokensState {
  tokens: IAssetRecord[]
  allTokens: IAssetRecord[]
  trendingTokens:IAssetRecord[]
  loading: boolean
  error: string | null
  nextCursor: string | null
  hasMore: boolean
  searchQuery: string
}


const initialState: TokensState = {
  tokens: [],
  allTokens: [],
  loading: false,
  trendingTokens:[],
  error: null,
  nextCursor: null,
  hasMore: true,
  searchQuery: "",
}

export const fetchTokens = createAsyncThunk(
  "tokens/fetchTokens",
  async (
    { limit = 12, search }: { limit?: number; search?: string },
    { rejectWithValue, getState }
  ) => {
    try {
      const state = getState() as { tokens: TokensState }
      const cursor = state.tokens.nextCursor
      const currentSearch = search !== undefined ? search : state.tokens.searchQuery

      const params: Record<string, any> = { limit, order: "asc" }

      if (cursor) {
        const url = new URL(cursor)
        const cursorParam = url.searchParams.get("cursor")
        if (cursorParam) {
          params.cursor = cursorParam
        }
      }

      const { data } = await axios.get<PaginatedResponse<IAssetRecord>>(
        "https://api.testnet.minepi.com/assets",
        { params }
      )

      return { data, search: currentSearch }
    } catch (err: any) {
      return rejectWithValue(err?.message || "Failed to fetch tokens")
    }
  }
)
export const fetchTrendingTokens = createAsyncThunk(
  "tokens/fetchTrendingTokens",
  async (
    { limit = 12, search }: { limit?: number; search?: string },
    { rejectWithValue, getState }
  ) => {
    try {
    

      const { data } = await axiosClient.get(
        "/api/tokens/top"
      )

      return data.tokens
    } catch (err: any) {
      return rejectWithValue(err?.message || "Failed to fetch tokens")
    }
  }
)

export interface MintTokenPayload {
  issuerSecret: string
  distributorSecret: string
  assetCode: string
  amount: string
  homeDomain: string
}

export const mintToken = createAsyncThunk(
  "tokens/mintToken",
  async (
    { issuerSecret, distributorSecret, assetCode, amount, homeDomain }: MintTokenPayload,
    { rejectWithValue }
  ) => {
    try {
      const payload = {
        issuerSecret,
        distributorSecret,
        assetCode,
        amount,
        homeDomain,
      }
      const { data } = await axiosClient.post("/api/tokens/mint", payload)
      return data
    } catch (err: any) {
      return rejectWithValue(err?.message || "Failed to mint token")
    }
  }
)

const tokensSlice = createSlice({
  name: "tokens",
  initialState,
  reducers: {
    clearTokens: (state) => {
      state.tokens = []
      state.allTokens = []
      state.nextCursor = null
      state.hasMore = true
      state.error = null
    },
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload
      if (action.payload && action.payload.trim()) {
        const searchUpper = action.payload.trim().toUpperCase()
        state.tokens = state.allTokens
          .filter(
            (token) =>
              token.asset_code.includes(searchUpper) ||
              token.asset_issuer.includes(searchUpper)
          )
          .sort((a, b) => b.num_liquidity_pools - a.num_liquidity_pools)
      } else {
        state.tokens = [...state.allTokens].sort(
          (a, b) => b.num_liquidity_pools - a.num_liquidity_pools
        )
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchTokens
      .addCase(fetchTokens.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchTokens.fulfilled, (state, action) => {
        state.loading = false
        const isNewSearch = action.payload.search !== state.searchQuery

        if (isNewSearch) {
          state.allTokens = action.payload.data._embedded.records
          state.searchQuery = action.payload.search
        } else {
          state.allTokens = [
            ...state.allTokens,
            ...action.payload.data._embedded.records,
          ]
        }

        if (action.payload.search && action.payload.search.trim()) {
          const searchUpper = action.payload.search.trim().toUpperCase()
          state.tokens = state.allTokens
            .filter(
              (token) =>
                token.asset_code.includes(searchUpper) ||
                token.asset_issuer.includes(searchUpper)
            )
            .sort((a, b) => b.num_liquidity_pools - a.num_liquidity_pools)
        } else {
          state.tokens = [...state.allTokens].sort(
            (a, b) => b.num_liquidity_pools - a.num_liquidity_pools
          )
        }

        state.nextCursor = action.payload.data._links.next?.href || null
        state.hasMore = !!action.payload.data._links.next?.href
      })
      .addCase(fetchTokens.rejected, (state, action) => {
        state.loading = false
        state.error =
          (action.payload as string) ||
          action.error.message ||
          "Failed to fetch tokens"
      })
      .addCase(mintToken.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(mintToken.fulfilled, (state, action) => {
        state.loading = false
        state.error = null
      })
      .addCase(mintToken.rejected, (state, action) => {
        state.loading = false
        state.error =
          (action.payload as string) ||
          action.error.message ||
          "Failed to mint token"
      })
      .addCase(fetchTrendingTokens.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchTrendingTokens.fulfilled, (state, action) => {
        state.loading = false
        state.error = null
        state.trendingTokens = action.payload
      })
      .addCase(fetchTrendingTokens.rejected, (state, action) => {
        state.loading = false
        state.error =
          (action.payload as string) ||
          action.error.message ||
          "Failed to mint token"
      })
  },
})

export const { clearTokens, setSearchQuery } = tokensSlice.actions
export default tokensSlice.reducer
