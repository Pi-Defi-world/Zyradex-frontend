import axios, { AxiosError, InternalAxiosRequestConfig } from "axios"
import { signIn } from "./api/auth"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL

if (!API_BASE_URL) {
  throw new Error(
    "NEXT_PUBLIC_API_URL environment variable is not set. "
  )
}

const REQUEST_TIMEOUT = 30000 

export const axiosClient = axios.create({
  baseURL: `${API_BASE_URL.replace(/\/$/, "")}/v1`,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: REQUEST_TIMEOUT,
})

// Request interceptor to always include auth token from localStorage
axiosClient.interceptors.request.use(
  (config) => {
    // Always check localStorage for token and set it on each request
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("dex_user_token")
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      } else {
        // Remove auth header if no token
        delete config.headers.Authorization
      }
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

export const setAuthToken = (token?: string | null) => {
  if (token) {
    axiosClient.defaults.headers.Authorization = `Bearer ${token}`
    // Also store in localStorage for interceptor to pick up
    if (typeof window !== "undefined") {
      localStorage.setItem("dex_user_token", token)
    }
  } else {
    delete axiosClient.defaults.headers.Authorization
    if (typeof window !== "undefined") {
      localStorage.removeItem("dex_user_token")
    }
  }
}

export const clearAuthToken = () => setAuthToken(undefined)

export interface ApiError {
  message: string
  status?: number
  code?: string
  details?: unknown
  suggestion?: string
  operationError?: string
  reason?: string
  requestId?: string
}

/**
 * Enhanced error conversion
 */
export const toApiError = (error: unknown): ApiError => {
  if (!error) {
    return { message: "Unknown error occurred" }
  }

  if ((error as AxiosError).isAxiosError) {
    const axiosError = error as AxiosError<{ 
      message?: string
      error?: string | unknown
      suggestion?: string
      operationError?: string
      reason?: string
      details?: unknown
      code?: string
      requestId?: string
    }>
    
    // Extract error data from response
    const errorData = axiosError.response?.data
    const status = axiosError.response?.status

    // Try to extract meaningful error message from various possible locations
    let message = 
      errorData?.message || 
      (typeof errorData?.error === 'string' ? errorData.error : null) ||
      axiosError.message || 
      "Request failed"

    // If message is still generic, try to provide more context
    if (message === "Request failed" || message === "Network Error") {
      if (axiosError.code === "ECONNABORTED" || status === 408) {
        message = "Request timed out. Please try again."
      } else if (axiosError.code === "ERR_NETWORK") {
        message = "Network error. Please check your connection and try again."
      } else if (status === 404) {
        message = errorData?.message || "Resource not found"
      } else if (status === 500) {
        // Check if it's a Pi Network API error (temporary issue)
        const isPiApiError = errorData?.message?.toLowerCase().includes("pi network api") || 
                            errorData?.message?.toLowerCase().includes("pi api") ||
                            message.toLowerCase().includes("pi network api") ||
                            message.toLowerCase().includes("pi api")
        if (isPiApiError) {
          message = errorData?.message || "Pi Network API is temporarily unavailable. Please try again in a few moments."
        } else {
          message = errorData?.message || "Server error. Please try again later."
        }
      } else if (status === 400) {
        message = errorData?.message || "Invalid request. Please check your input."
      } else if (status === 401) {
        message = errorData?.message || "Authentication required. Please sign in again."
      } else if (status === 403) {
        message = errorData?.message || "Access denied. You don't have permission for this action."
      } else if (status === 429) {
        message = errorData?.message || `Too many requests. Please wait before trying again.`
      } else if (status === 503) {
        message = errorData?.message || "Service temporarily unavailable. Please try again in a few moments."
      }
    }

    // Detect Pi Network API errors (temporary issues)
    const isPiApiError = message?.toLowerCase().includes("pi network api") || 
                        message?.toLowerCase().includes("pi api") ||
                        errorData?.message?.toLowerCase().includes("pi network api") ||
                        errorData?.message?.toLowerCase().includes("pi api")

    // Build suggestion based on error type
    let suggestion = errorData?.suggestion
    if (!suggestion) {
      if (isPiApiError) {
        suggestion = "This is a temporary issue with Pi Network's API, not your account. Please wait a moment and try again."
      } else if (status === 401) {
        suggestion = "Please refresh the page and sign in again."
      } else if (status === 500 || status === 503) {
        suggestion = "If the problem persists, please contact support."
      }
    }

    // For Pi API errors, treat as 503 (service unavailable) rather than 500 (server error)
    const finalStatus = (status === 500 && isPiApiError) ? 503 : status

    return {
      message,
      status: finalStatus,
      code: errorData?.code,
      details: errorData?.details || errorData?.error,
      suggestion,
      operationError: errorData?.operationError,
      reason: errorData?.reason,
      requestId: errorData?.requestId,
    }
  }

  if (error instanceof Error) {
    const message = error.message || "An error occurred"
    // Check if it's a Pi API error (even if it's an Error instance, not AxiosError)
    const isPiApiError = message.toLowerCase().includes("pi network api") || 
                        message.toLowerCase().includes("pi api") ||
                        (error as any).isPiApiError === true
    
    return { 
      message,
      status: isPiApiError ? 503 : undefined,
      suggestion: isPiApiError 
        ? "This is a temporary issue with Pi Network's API, not your account. Please wait a moment and try again."
        : undefined
    }
  }

  if (typeof error === "string") {
    return { message: error }
  }

  // Try to stringify the error object to get some information
  try {
    const errorStr = JSON.stringify(error)
    if (errorStr !== "{}") {
      return { message: `Error: ${errorStr}` }
    }
  } catch {
    // Ignore JSON stringify errors
  }

  return { 
    message: "An unexpected error occurred. Please try again."
  }
}

