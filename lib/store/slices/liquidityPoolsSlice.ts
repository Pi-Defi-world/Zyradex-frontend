import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import type { ILiquidityPool, PaginatedResponse } from "@/lib/types"
import axios from "axios"
import { axiosClient } from "@/lib/api"

interface LiquidityPoolsState {
  pools: ILiquidityPool[]
  allPools: ILiquidityPool[] // Store all fetched pools for client-side filtering
  loading: boolean
  error: string | null
  searchQuery: string
  nextCursor: string | null
  hasMore: boolean
}

const initialState: LiquidityPoolsState = {
  pools: [],
  allPools: [],
  loading: false,
  error: null,
  searchQuery: "",
  nextCursor: null,
  hasMore: true,
}

export const createLiquidityPool = createAsyncThunk(
  "liquidityPools/createLiquidityPool",
  async (
    {
      userSecret,
      tokenA,
      tokenB,
      amountA,
      amountB,
    }: {
      userSecret: string
      tokenA: { code: string; issuer: string }
      tokenB: { code: string; issuer: string }
      amountA: string
      amountB: string
    },
    { rejectWithValue }
  ) => {
    try {
      // Compose payload for backend API
      const payload = {
        userSecret,
        tokenA,
        tokenB,
        amountA,
        amountB,
      }

      const { data } = await axiosClient.post(
        "/api/pools",
        payload,
      )

      return data
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message || err?.message || "Failed to create liquidity pool")
    }
  }
)
export const fetchPools = createAsyncThunk(
  "liquidityPools/fetchPools",
  async ({ limit = 12, search }: { limit?: number; search?: string }, { rejectWithValue, getState }) => {
    try {
      const state = getState() as { liquidityPools: LiquidityPoolsState }
      const cursor = state.liquidityPools.nextCursor
      const currentSearch = search !== undefined ? search : state.liquidityPools.searchQuery

      const params: Record<string, any> = { limit, order: "asc" }

      if (cursor) {
        const url = new URL(cursor)
        const cursorParam = url.searchParams.get("cursor")
        if (cursorParam) {
          params.cursor = cursorParam
        }
      }

      const { data } = await axios.get<PaginatedResponse<ILiquidityPool>>(
        "https://api.testnet.minepi.com/liquidity_pools/",
        {
          params,
        },
      )

      return { data, search: currentSearch }
    } catch (err: any) {
      return rejectWithValue(err?.message || "Failed to fetch pools")
    }
  },
)


const liquidityPoolsSlice = createSlice({
  name: "liquidityPools",
  initialState,
  reducers: {
    clearPools: (state) => {
      state.pools = []
      state.allPools = []
      state.nextCursor = null
      state.hasMore = true
      state.error = null
    },
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload
      if (action.payload && action.payload.trim()) {
        const searchUpper = action.payload.trim().toUpperCase()
        state.pools = state.allPools
          .filter((pool) => {
            return pool.reserves.some((reserve) => {
              const assetParts = reserve.asset.split(":")
              const assetCode = assetParts[0]
              return assetCode.includes(searchUpper)
            })
          })
          .sort((a, b) => Number(b.total_trustlines) - Number(a.total_trustlines))
      } else {
        state.pools = [...state.allPools].sort((a, b) => Number(b.total_trustlines) - Number(a.total_trustlines))
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPools.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchPools.fulfilled, (state, action) => {
        state.loading = false
        const isNewSearch = action.payload.search !== state.searchQuery

        if (isNewSearch) {
          state.allPools = action.payload.data._embedded.records
          state.searchQuery = action.payload.search
        } else {
          state.allPools = [...state.allPools, ...action.payload.data._embedded.records]
        }

        if (action.payload.search && action.payload.search.trim()) {
          const searchUpper = action.payload.search.trim().toUpperCase()
          state.pools = state.allPools
            .filter((pool) => {
              return pool.reserves.some((reserve) => {
                const assetParts = reserve.asset.split(":")
                const assetCode = assetParts[0]
                return assetCode.includes(searchUpper)
              })
            })
            .sort((a, b) => Number(b.total_trustlines) - Number(a.total_trustlines))
        } else {
          state.pools = [...state.allPools].sort((a, b) => Number(b.total_trustlines) - Number(a.total_trustlines))
        }

        state.nextCursor = action.payload.data._links.next?.href || null
        state.hasMore = !!action.payload.data._links.next?.href
      })
      .addCase(fetchPools.rejected, (state, action) => {
        state.loading = false
        state.error = (action.payload as string) || action.error.message || "Failed to fetch pools"
      })
  },
})

export const { clearPools, setSearchQuery } = liquidityPoolsSlice.actions
export default liquidityPoolsSlice.reducer
