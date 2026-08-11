"use client"

import { Component, type ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { AlertTriangle, RefreshCw } from "lucide-react"

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error("ErrorBoundary caught:", error.message, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div className="min-h-screen premium-gradient pt-24 pb-24 flex items-center justify-center p-4">
          <div className="max-w-md text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto">
              <AlertTriangle className="h-8 w-8 text-amber-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">Something went wrong</h1>
              <p className="text-sm text-muted-foreground mt-2">
                An unexpected error occurred. Please try refreshing the page.
              </p>
              {this.state.error && (
                <p className="text-xs text-muted-foreground mt-1 font-mono bg-muted/50 rounded p-2 mt-2 break-all">
                  {this.state.error.message}
                </p>
              )}
            </div>
            <Button
              onClick={() => {
                this.setState({ hasError: false, error: undefined })
                window.location.reload()
              }}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh Page
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
