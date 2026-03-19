import { axiosClient, toApiError } from "../api"
import type { AdminUser } from "./auth"

export const getMe = async (): Promise<{ success: boolean; user: AdminUser }> => {
  try {
    const { data } = await axiosClient.get<{ success: boolean; user: AdminUser }>("/users/me")
    return data
  } catch (error) {
    throw toApiError(error)
  }
}

export const upsertBusinessProfile = async (payload: {
  companyName?: string
  billingEmail?: string
}) => {
  try {
    const { data } = await axiosClient.put<{ success: boolean; user: AdminUser }>(
      "/users/business-profile",
      payload,
    )
    return data
  } catch (error) {
    throw toApiError(error)
  }
}

export const upsertDeveloperProfile = async (payload: {
  webhookUrl?: string
  sandboxEnabled?: boolean
  productionEnabled?: boolean
}) => {
  try {
    const { data } = await axiosClient.put<{ success: boolean; user: AdminUser }>(
      "/users/developer-profile",
      payload,
    )
    return data
  } catch (error) {
    throw toApiError(error)
  }
}

export const createDeveloperApiKey = async (name?: string) => {
  try {
    const { data } = await axiosClient.post<{ success: boolean; apiKey: string; user: AdminUser }>(
      "/users/developer-profile/api-keys",
      name ? { name } : {},
    )
    return data
  } catch (error) {
    throw toApiError(error)
  }
}

export const revokeDeveloperApiKey = async (keyId: string) => {
  try {
    const { data } = await axiosClient.post<{ success: boolean; user: AdminUser }>(
      "/users/developer-profile/api-keys/revoke",
      { keyId },
    )
    return data
  } catch (error) {
    throw toApiError(error)
  }
}

