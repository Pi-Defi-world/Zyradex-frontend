import axios, { AxiosError, InternalAxiosRequestConfig } from "axios"

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
  retryAfter?: number
  requestId?: string
  canRetry?: boolean
}

/**
 * Determine if an error is retryable
 */
const isRetryableError = (error: AxiosError): boolean => {
  // Network errors are retryable
  if (!error.response) {
    return true
  }

  const status = error.response.status

  // 5xx errors are retryable (server errors)
  if (status >= 500 && status < 600) {
    return true
  }

  // 408 Request Timeout is retryable
  if (status === 408) {
    return true
  }

  // 429 Rate Limit - retryable after delay
  if (status === 429) {
    return true
  }

  // 503 Service Unavailable is retryable
  if (status === 503) {
    return true
  }

  return false
}

/**
 * Enhanced error conversion with retry logic support
 */
export const toApiError = (error: unknown): ApiError => {
  if (!error) {
    return { message: "Unknown error occurred", canRetry: false }
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
      retryAfter?: number
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

    // Determine if error is retryable
    const canRetry = isRetryableError(axiosError)

    // If message is still generic, try to provide more context
    if (message === "Request failed" || message === "Network Error") {
      if (axiosError.code === "ECONNABORTED" || status === 408) {
        message = "Request timed out. Please try again."
      } else if (axiosError.code === "ERR_NETWORK") {
        message = "Network error. Please check your connection and try again."
      } else if (status === 404) {
        message = errorData?.message || "Resource not found"
      } else if (status === 500) {
        message = errorData?.message || "Server error. Please try again later."
      } else if (status === 400) {
        message = errorData?.message || "Invalid request. Please check your input."
      } else if (status === 401) {
        message = errorData?.message || "Authentication required. Please sign in again."
      } else if (status === 403) {
        message = errorData?.message || "Access denied. You don't have permission for this action."
      } else if (status === 429) {
        const retryAfter = errorData?.retryAfter || 60
        message = errorData?.message || `Too many requests. Please wait ${retryAfter} seconds before trying again.`
      } else if (status === 503) {
        message = errorData?.message || "Service temporarily unavailable. Please try again in a few moments."
      }
    }

    // Build suggestion based on error type
    let suggestion = errorData?.suggestion
    if (!suggestion) {
      if (canRetry && status !== 429) {
        suggestion = "This error may be temporary. Please try again."
      } else if (status === 429) {
        const retryAfter = errorData?.retryAfter || 60
        suggestion = `Please wait ${retryAfter} seconds before trying again.`
      } else if (status === 401) {
        suggestion = "Please refresh the page and sign in again."
      } else if (status === 500 || status === 503) {
        suggestion = "If the problem persists, please contact support."
      }
    }

    return {
      message,
      status,
      code: errorData?.code,
      details: errorData?.details || errorData?.error,
      suggestion,
      operationError: errorData?.operationError,
      reason: errorData?.reason,
      retryAfter: errorData?.retryAfter,
      requestId: errorData?.requestId,
      canRetry,
    }
  }

  if (error instanceof Error) {
    return { 
      message: error.message || "An error occurred",
      canRetry: false
    }
  }

  if (typeof error === "string") {
    return { message: error, canRetry: false }
  }

  // Try to stringify the error object to get some information
  try {
    const errorStr = JSON.stringify(error)
    if (errorStr !== "{}") {
      return { message: `Error: ${errorStr}`, canRetry: false }
    }
  } catch {
    // Ignore JSON stringify errors
  }

  return { 
    message: "An unexpected error occurred. Please try again.",
    canRetry: false
  }
}

/**
 * Retry interceptor for transient errors
 */
let retryCount = 0
const MAX_RETRIES = 3

axiosClient.interceptors.response.use(
  (response) => {
    retryCount = 0 // Reset on success
    return response
  },
  async (error: AxiosError) => {
    const config = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    // Don't retry if already retried or not a retryable error
    if (config._retry || !isRetryableError(error) || retryCount >= MAX_RETRIES) {
      retryCount = 0
      return Promise.reject(error)
    }

    // Don't retry on rate limit errors (429) - user should wait
    if (error.response?.status === 429) {
      retryCount = 0
      return Promise.reject(error)
    }

    retryCount++
    config._retry = true

    // Exponential backoff: 1s, 2s, 4s
    const delay = Math.min(1000 * Math.pow(2, retryCount - 1), 4000)
    
    await new Promise(resolve => setTimeout(resolve, delay))

    return axiosClient(config)
  }
)

