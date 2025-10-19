"use client"

import { create } from "zustand"

export type LogType = "info" | "success" | "error"

export interface Log {
  id: string
  type: LogType
  message: string
  timestamp: string
}

interface LoggerStore {
  logs: Log[]
  addLog: (type: LogType, message: string) => void
  clearLogs: () => void
}

export const useLogger = create<LoggerStore>((set) => ({
  logs: [],
  addLog: (type, message) => {
    const log: Log = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      message,
      timestamp: new Date().toLocaleTimeString(),
    }
    set((state) => ({ logs: [...state.logs, log] }))
  },
  clearLogs: () => set({ logs: [] }),
}))
