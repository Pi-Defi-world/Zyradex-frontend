import axios, { AxiosError } from "axios"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export const axiosClient = axios.create({
  baseURL: `${API_BASE_URL.replace(/\/$/, "")}/v1`,
  headers: {
    "Content-Type": "application/json",
  },
})

export const setAuthToken = (token?: string | null) => {
  if (token) {
    axiosClient.defaults.headers.Authorization = `Bearer ${token}`
  } else {
    delete axiosClient.defaults.headers.Authorization
  }
}

export const clearAuthToken = () => setAuthToken(undefined)

export interface ApiError {
  message: string
  status?: number
  details?: unknown
  suggestion?: string
  operationError?: string
  reason?: string
}

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
    }>
    
    // Try to extract meaningful error message from various possible locations
    let message = 
      axiosError.response?.data?.message || 
      (typeof axiosError.response?.data?.error === 'string' ? axiosError.response.data.error : null) ||
      axiosError.message || 
      "Request failed"

    // If message is still generic, try to provide more context
    if (message === "Request failed" || message === "Network Error") {
      if (axiosError.code === "ECONNABORTED") {
        message = "Request timed out. Please try again."
      } else if (axiosError.code === "ERR_NETWORK") {
        message = "Network error. Please check your connection."
      } else if (axiosError.response?.status === 404) {
        message = "Resource not found"
      } else if (axiosError.response?.status === 500) {
        message = "Server error. Please try again later."
      } else if (axiosError.response?.status === 400) {
        // For 400 errors, use the backend message if available, otherwise generic
        message = axiosError.response?.data?.message || "Invalid request. Please check your input."
      } else if (axiosError.response?.status === 401) {
        message = "Authentication required. Please sign in again."
      } else if (axiosError.response?.status === 403) {
        message = "Access denied. You don't have permission for this action."
      }
    }

    return {
      message,
      status: axiosError.response?.status,
      details: axiosError.response?.data?.details || axiosError.response?.data?.error,
      suggestion: axiosError.response?.data?.suggestion,
      operationError: axiosError.response?.data?.operationError,
      reason: axiosError.response?.data?.reason,
    }
  }

  if (error instanceof Error) {
    return { message: error.message || "An error occurred" }
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

  return { message: "An unexpected error occurred. Please try again." }
}

