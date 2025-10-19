import { configureStore } from "@reduxjs/toolkit"
import tokensReducer from "./slices/tokensSlice"
import myTokensReducer from "./slices/myTokensSlice"
import liquidityPoolsReducer from "./slices/liquidityPoolsSlice"

export const store = configureStore({
  reducer: {
    tokens: tokensReducer,
    myTokens: myTokensReducer,
    liquidityPools: liquidityPoolsReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
