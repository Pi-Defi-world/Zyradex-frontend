"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"
import { X, CheckCircle2, Loader2, AlertCircle, ExternalLink } from "lucide-react"

type TxStatus = "pending" | "success" | "error"

interface TxPopup {
  id: string
  type: string
  title: string
  description: string
  status: TxStatus
  txHash?: string
}

interface TxPopupContextValue {
  popups: TxPopup[]
  showPopup: (popup: Omit<TxPopup, "id">) => string
  updatePopup: (id: string, updates: Partial<Omit<TxPopup, "id">>) => void
  dismissPopup: (id: string) => void
}

const TxPopupContext = createContext<TxPopupContextValue | null>(null)

export function TransactionPopupProvider({ children }: { children: ReactNode }) {
  const [popups, setPopups] = useState<TxPopup[]>([])

  const showPopup = useCallback((popup: Omit<TxPopup, "id">) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    setPopups((prev) => [...prev, { ...popup, id }])
    return id
  }, [])

  const updatePopup = useCallback((id: string, updates: Partial<Omit<TxPopup, "id">>) => {
    setPopups((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)))
  }, [])

  const dismissPopup = useCallback((id: string) => {
    setPopups((prev) => prev.filter((p) => p.id !== id))
  }, [])

  return (
    <TxPopupContext.Provider value={{ popups, showPopup, updatePopup, dismissPopup }}>
      {children}
      <TxPopupOverlay popups={popups} onDismiss={dismissPopup} />
    </TxPopupContext.Provider>
  )
}

function TxPopupOverlay({ popups, onDismiss }: { popups: TxPopup[]; onDismiss: (id: string) => void }) {
  if (popups.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full">
      {popups.map((popup) => (
        <div
          key={popup.id}
          className={`rounded-xl border p-4 shadow-xl backdrop-blur-sm animate-in slide-in-from-right ${
            popup.status === "success"
              ? "bg-emerald-50/95 border-emerald-200 dark:bg-emerald-950/95 dark:border-emerald-800"
              : popup.status === "error"
                ? "bg-red-50/95 border-red-200 dark:bg-red-950/95 dark:border-red-800"
                : "bg-white/95 border-slate-200 dark:bg-slate-900/95 dark:border-slate-700"
          }`}
        >
          <div className="flex items-start gap-3">
            <div className="shrink-0 mt-0.5">
              {popup.status === "success" && <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
              {popup.status === "error" && <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />}
              {popup.status === "pending" && <Loader2 className="h-5 w-5 animate-spin text-blue-600 dark:text-blue-400" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-slate-900 dark:text-white">{popup.title}</p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 line-clamp-2">{popup.description}</p>
              {popup.txHash && (
                <a
                  href={`https://explorer.minepi.com/explorer/tx/${popup.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline mt-1"
                >
                  View on Explorer <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
            <button
              onClick={() => onDismiss(popup.id)}
              className="shrink-0 p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              <X className="h-4 w-4 text-slate-400" />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

export function useTransactionPopup() {
  const ctx = useContext(TxPopupContext)
  if (!ctx) throw new Error("useTransactionPopup must be used within TransactionPopupProvider")
  return ctx
}

export { type TxPopup, type TxStatus }
