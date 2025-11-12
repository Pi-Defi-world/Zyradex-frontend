import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import type { TokenRecord } from "@/lib/api/tokens"
import { fetchTokens as fetchTokensApi } from "@/lib/api/tokens"
import { toApiError } from "@/lib/api"

interface MyTokensState {
  tokens: TokenRecord[]
  loading: boolean
  error: string | null
}

const initialState: MyTokensState = {
  tokens: [],
  loading: false,
  error: null,
}

export const fetchMyTokens = createAsyncThunk("myTokens/fetchMyTokens", async (_, { rejectWithValue }) => {
  try {
    const response = await fetchTokensApi()
    return response.tokens
  } catch (error) {
    const apiError = toApiError(error)
    return rejectWithValue(apiError.message)
  }
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
        state.error = (action.payload as string) || action.error.message || "Failed to fetch my tokens"
      })
  },
})

export default myTokensSlice.reducer
