import { axiosClient, toApiError } from "../api"

export interface AuthResultPayload {
  accessToken: string
  user: {
    username: string
    uid: string
  }
}

export interface SignInPayload {
  authResult: AuthResultPayload
}

export interface AdminUser {
  id: string
  uid: string
  username: string
  role: "user" | "creator" | "admin"
  verified: boolean
  public_key?: string
  avatarUrl?: string
}

export interface SignInResponse {
  user: AdminUser
  token: string
}

export const signIn = async (payload: SignInPayload) => {
  try {
    const { data } = await axiosClient.post<SignInResponse>("/users/signin", payload)
    return data
  } catch (error) {
    throw toApiError(error)
  }
}

export const removePublicKey = async () => {
  try {
    const { data } = await axiosClient.delete<{ success: boolean; message: string }>("/users/public-key")
    return data
  } catch (error) {
    throw toApiError(error)
  }
}