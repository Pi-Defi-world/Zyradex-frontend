import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import type { IAssetRecord } from "@/lib/types"
import { api } from "@/lib/api"

interface MyTokensState {
  tokens: IAssetRecord[]
  loading: boolean
  error: string | null
}

const initialState: MyTokensState = {
  tokens: [],
  loading: false,
  error: null,
}

export const fetchMyTokens = createAsyncThunk("myTokens/fetchMyTokens", async () => {
  const response = await api.fetchMyTokens()
  return response
})

const myTokensSlice = createSlice({
  name: "myTokens",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyTokens.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchMyTokens.fulfilled, (state, action) => {
        state.loading = false
        state.tokens = action.payload
      })
      .addCase(fetchMyTokens.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || "Failed to fetch my tokens"
      })
  },
})

export default myTokensSlice.reducer
