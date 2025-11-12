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
}

export const toApiError = (error: unknown): ApiError => {
  if (!error) {
    return { message: "Unknown error" }
  }

  if ((error as AxiosError).isAxiosError) {
    const axiosError = error as AxiosError<{ message?: string; error?: unknown }>
    const message = axiosError.response?.data?.message || axiosError.message || "Request failed"
    return {
      message,
      status: axiosError.response?.status,
      details: axiosError.response?.data?.error,
    }
  }

  if (error instanceof Error) {
    return { message: error.message }
  }

  if (typeof error === "string") {
    return { message: error }
  }

  return { message: "Unexpected error" }
}

