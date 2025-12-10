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

/**
 * Attempt to refresh the authentication token
 * Returns the new token if successful, null if refresh is not possible
 */
let isRefreshing = false
let refreshPromise: Promise<string | null> | null = null

const attemptTokenRefresh = async (): Promise<string | null> => {
  // If already refreshing, wait for that to complete
  if (isRefreshing && refreshPromise) {
    return refreshPromise
  }

  // Check if we're in a browser environment
  if (typeof window === "undefined") {
    return null
  }

  // Check if Pi SDK is available - this is the primary source of truth
  if (!window.Pi) {
    console.log("🔄 Pi SDK not available, cannot refresh auth")
    return null
  }

  isRefreshing = true
  refreshPromise = (async () => {
    try {
      console.log("🔄 Attempting to refresh authentication token...")
      
      // PRIMARY APPROACH: Get fresh token from Pi SDK
      // If SDK has a valid session, authenticate() will return immediately without showing consent
      // This is the source of truth - trust the SDK's session state
      let piAccessToken: string | null = null
      let piUser: any = null
      
      try {
        console.log("🔄 Getting current authentication state from Pi SDK...")
        window.Pi.init({ version: "2.0" })
        
        const onIncompletePaymentFound = (payment: any) => {
          console.log("⚠️ Incomplete payment found during refresh:", payment)
        }
        
        // Call authenticate() - if SDK has valid session, this returns immediately
        // If session expired, it will show consent screen
        const freshAuth = await window.Pi.authenticate(["username", "payments", "wallet_address"], onIncompletePaymentFound)
        
        if (freshAuth?.accessToken) {
          piAccessToken = freshAuth.accessToken
          piUser = freshAuth.user
          
          // Update stored credentials with fresh token from SDK
          localStorage.setItem("pi_access_token", piAccessToken)
          localStorage.setItem("pi_user", JSON.stringify(piUser))
          
          console.log("✅ Got fresh access token from Pi SDK")
        } else {
          console.log("🔄 Pi SDK authenticate() did not return access token")
        }
      } catch (piAuthError: any) {
        console.warn("🔄 Pi SDK authenticate() failed, falling back to stored token:", piAuthError?.message)
        // Fall through to try stored token as fallback
      }
      
      // FALLBACK: If SDK didn't provide token, try stored token from localStorage
      if (!piAccessToken) {
        const storedToken = localStorage.getItem("pi_access_token")
        const storedUserStr = localStorage.getItem("pi_user")
        
        if (storedToken && storedUserStr) {
          try {
            piUser = JSON.parse(storedUserStr)
            piAccessToken = storedToken
            console.log("🔄 Using stored Pi access token as fallback")
          } catch {
            console.error("🔄 Failed to parse stored Pi user data")
            return null
          }
        } else {
          console.log("🔄 No stored Pi credentials available")
          return null
        }
      }
      
      if (!piAccessToken || !piUser) {
        console.log("🔄 Unable to get Pi access token from SDK or storage")
        return null
      }

      // Create a clean axios instance for signin to avoid including expired token
      const signInClient = axios.create({
        baseURL: `${API_BASE_URL.replace(/\/$/, "")}/v1`,
        headers: {
          "Content-Type": "application/json",
        },
        timeout: REQUEST_TIMEOUT,
      })
      
      const payload = {
        authResult: {
          accessToken: piAccessToken,
          user: {
            username: piUser.username || "",
            uid: piUser.uid || "",
          },
        },
      }
      
      let result
      try {
        result = await signInClient.post<{ user: any; token: string }>("/users/signin", payload).then(res => res.data)
      } catch (signInErr: any) {
        const statusCode = signInErr?.response?.status || signInErr?.status
        const errorMessage = signInErr?.response?.data?.message || signInErr?.message || ""
        
        // Handle Pi Network API errors (temporary issues)
        if (statusCode === 500 && (errorMessage.toLowerCase().includes("pi network") || errorMessage.toLowerCase().includes("pi api"))) {
          console.log("⚠️ Pi Network API error during token refresh - this is temporary")
          // Return null to indicate refresh failed, but don't clear auth data
          // The user might still be authenticated, just Pi API is down
          return null
        }
        
        // If token is invalid/expired and we used stored token, try SDK one more time
        const isInvalidToken = statusCode === 401 || 
                              statusCode === 403 ||
                              errorMessage.toLowerCase().includes("invalid access token") ||
                              errorMessage.toLowerCase().includes("expired access token") ||
                              errorMessage.toLowerCase().includes("invalid or expired")
        
        if (isInvalidToken && piAccessToken === localStorage.getItem("pi_access_token")) {
          // We used stored token and it failed - try SDK one more time
          console.log("🔄 Stored token invalid, attempting one more time with Pi SDK...")
          try {
            window.Pi.init({ version: "2.0" })
            const onIncompletePaymentFound = (payment: any) => {
              console.log("⚠️ Incomplete payment found during retry:", payment)
            }
            
            const retryAuth = await window.Pi.authenticate(["username", "payments", "wallet_address"], onIncompletePaymentFound)
            
            if (retryAuth?.accessToken) {
              // Update and retry with fresh SDK token
              localStorage.setItem("pi_access_token", retryAuth.accessToken)
              localStorage.setItem("pi_user", JSON.stringify(retryAuth.user))
              
              const retryPayload = {
                authResult: {
                  accessToken: retryAuth.accessToken,
                  user: {
                    username: retryAuth.user?.username || "",
                    uid: retryAuth.user?.uid || "",
                  },
                },
              }
              
              result = await signInClient.post<{ user: any; token: string }>("/users/signin", retryPayload).then(res => res.data)
              console.log("✅ Successfully refreshed with retry from Pi SDK")
            } else {
              throw signInErr
            }
          } catch (retryError) {
            console.error("🔄 Retry with Pi SDK also failed")
            throw signInErr
          }
        } else {
          // Re-throw other errors
          throw signInErr
        }
      }
      
      const newToken = result.token

      // Validate token is not expired
      try {
        const jwtDecode = (await import("jwt-decode")).jwtDecode
        const claims = jwtDecode<{ exp?: number }>(newToken)
        if (claims.exp && claims.exp * 1000 < Date.now()) {
          console.error("🔄 Received expired token from refresh")
          return null
        }
      } catch {
        // If we can't decode, assume it's valid and let the backend validate
      }

      // Update token in storage and axios client
      setAuthToken(newToken)
      
      // Update profile in localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("dex_user_profile", JSON.stringify(result.user))
      }

      console.log("✅ Successfully refreshed authentication token")
      return newToken
    } catch (error: any) {
      console.error("🔄 Failed to refresh token:", error)
      
      // Check if it's a Pi API error (temporary issue)
      const statusCode = error?.response?.status || error?.status
      const errorMessage = error?.response?.data?.message || error?.message || ""
      const isPiApiError = statusCode === 500 && (
        errorMessage.toLowerCase().includes("pi network api") || 
        errorMessage.toLowerCase().includes("pi api")
      )
      
      // Don't clear auth data for Pi API errors - they're temporary
      if (!isPiApiError) {
        // If refresh fails, clear all auth data
        clearAuthToken()
        if (typeof window !== "undefined") {
          localStorage.removeItem("dex_user_token")
          localStorage.removeItem("dex_user_profile")
          localStorage.removeItem("pi_access_token")
          localStorage.removeItem("pi_user")
        }
      } else {
        console.log("⚠️ Pi Network API error during refresh - not clearing auth data (temporary issue)")
      }
      
      return null
    } finally {
      isRefreshing = false
      refreshPromise = null
    }
  })()

  return refreshPromise
}

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
        const retryAfter = errorData?.retryAfter || 60
        message = errorData?.message || `Too many requests. Please wait ${retryAfter} seconds before trying again.`
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
      } else if (canRetry && status !== 429) {
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

    // For Pi API errors, treat as 503 (service unavailable) rather than 500 (server error)
    // This prevents clearing auth data and indicates it's temporary
    const finalStatus = (status === 500 && isPiApiError) ? 503 : status
    const finalCanRetry = isPiApiError ? true : canRetry

    return {
      message,
      status: finalStatus,
      code: errorData?.code,
      details: errorData?.details || errorData?.error,
      suggestion,
      operationError: errorData?.operationError,
      reason: errorData?.reason,
      retryAfter: errorData?.retryAfter,
      requestId: errorData?.requestId,
      canRetry: finalCanRetry,
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
      canRetry: isPiApiError,
      suggestion: isPiApiError 
        ? "This is a temporary issue with Pi Network's API, not your account. Please wait a moment and try again."
        : undefined
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
    const config = error.config as InternalAxiosRequestConfig & { 
      _retry?: boolean
      _authRetry?: boolean
    }

    // Handle 401 Unauthorized errors - attempt token refresh
    if (error.response?.status === 401 && !config._authRetry) {
      // Don't attempt refresh on signin endpoint to avoid infinite loops
      if (config.url?.includes("/users/signin")) {
        return Promise.reject(error)
      }

      const errorData = error.response?.data as { expired?: boolean; code?: string; message?: string } | undefined
      const isExpired = errorData?.expired === true || errorData?.code === "TOKEN_EXPIRED"
      const isInvalidToken = errorData?.code === "INVALID_TOKEN"
      
      // Attempt refresh for expired tokens, and also for invalid tokens
      // (invalid tokens might be stale/expired tokens that weren't properly marked)
      // Only skip refresh if it's a clear non-expiration issue like USER_NOT_FOUND
      const shouldAttemptRefresh = isExpired || isInvalidToken || !errorData?.code || errorData?.code === "AUTH_ERROR"
      
      if (shouldAttemptRefresh) {
        console.log(`🔒 Token issue detected (${errorData?.code || 'unknown'}), attempting refresh...`)
        console.log(`🔒 Original request: ${config.method?.toUpperCase()} ${config.url}`)
        config._authRetry = true

        try {
          const newToken = await attemptTokenRefresh()
          
          if (newToken) {
            // Retry the original request with the new token
            console.log("✅ Token refresh successful, retrying original request...")
            config.headers.Authorization = `Bearer ${newToken}`
            const retryResponse = await axiosClient(config)
            console.log("✅ Original request succeeded after token refresh")
            return retryResponse
          } else {
            // Refresh failed - clear auth and reject
            console.error("❌ Token refresh failed - no new token received")
            
            // Dispatch a custom event that components can listen to
            if (typeof window !== "undefined") {
              window.dispatchEvent(new CustomEvent("auth:expired", {
                detail: { 
                  message: "Your session has expired. Please sign in again.",
                  error: toApiError(error)
                }
              }))
            }
            
            return Promise.reject(error)
          }
        } catch (refreshError: any) {
          console.error("❌ Error during token refresh:", refreshError)
          console.error("❌ Refresh error details:", {
            message: refreshError?.message,
            response: refreshError?.response?.data,
            status: refreshError?.response?.status
          })
          return Promise.reject(error)
        }
      } else {
        // Specific error that shouldn't trigger refresh (e.g., USER_NOT_FOUND)
        console.log(`🔒 Authentication error (${errorData?.code}): ${errorData?.message || 'Unknown error'}`)
        
        if (typeof window !== "undefined") {
          const errorData = error.response?.data as { message?: string } | undefined
          window.dispatchEvent(new CustomEvent("auth:expired", {
            detail: { 
              message: errorData?.message || "Authentication failed. Please sign in again.",
              error: toApiError(error)
            }
          }))
        }
        
        return Promise.reject(error)
      }
    }

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

