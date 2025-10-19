"use client"

import type React from "react"

import { Provider } from "react-redux"
import { store } from "./store/store"

export function Providers({ children }: { children: React.ReactNode }) {
  return <Provider store={store}>{children}</Provider>
}
