import { axiosClient, toApiError } from "../api"
import type {
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
} from '@simplewebauthn/types'

export interface StartRegistrationResponse {
  options: PublicKeyCredentialCreationOptionsJSON
  sessionId: string
}

export interface VerifyRegistrationPayload {
  credential: unknown
  sessionId: string
}

export interface VerifyRegistrationResponse {
  success: boolean
  verified: boolean
  credentialId: string
}

export interface StartAuthenticationResponse {
  options: PublicKeyCredentialRequestOptionsJSON
  sessionId: string
}

export interface VerifyAuthenticationPayload {
  credential: unknown
  sessionId: string
}

export interface VerifyAuthenticationResponse {
  success: boolean
  verified: boolean
  credentialId: string
  sessionToken: string
}

export interface PasskeyRecord {
  credentialId: string
  deviceName: string
  lastUsedAt: string | null
  createdAt: string
  isActive: boolean
}

export interface ListPasskeysResponse {
  success: boolean
  passkeys: PasskeyRecord[]
}

export interface DeletePasskeyResponse {
  success: boolean
  message: string
}

export const startPasskeyRegistration = async (): Promise<StartRegistrationResponse> => {
  try {
    const { data } = await axiosClient.post<StartRegistrationResponse>("/passkey/register/start")
    return data
  } catch (error) {
    throw toApiError(error)
  }
}

export const verifyPasskeyRegistration = async (
  payload: VerifyRegistrationPayload
): Promise<VerifyRegistrationResponse> => {
  try {
    const { data } = await axiosClient.post<VerifyRegistrationResponse>(
      "/passkey/register/verify",
      payload
    )
    return data
  } catch (error) {
    throw toApiError(error)
  }
}

export const startPasskeyAuthentication = async (): Promise<StartAuthenticationResponse> => {
  try {
    const { data } = await axiosClient.post<StartAuthenticationResponse>(
      "/passkey/authenticate/start"
    )
    return data
  } catch (error) {
    throw toApiError(error)
  }
}

export const verifyPasskeyAuthentication = async (
  payload: VerifyAuthenticationPayload
): Promise<VerifyAuthenticationResponse> => {
  try {
    const { data } = await axiosClient.post<VerifyAuthenticationResponse>(
      "/passkey/authenticate/verify",
      payload
    )
    return data
  } catch (error) {
    throw toApiError(error)
  }
}

export const listPasskeys = async (): Promise<ListPasskeysResponse> => {
  try {
    const { data } = await axiosClient.get<ListPasskeysResponse>("/passkey/list")
    return data
  } catch (error) {
    throw toApiError(error)
  }
}

export const deletePasskey = async (credentialId: string): Promise<DeletePasskeyResponse> => {
  try {
    const { data } = await axiosClient.delete<DeletePasskeyResponse>(
      `/passkey/${credentialId}`
    )
    return data
  } catch (error) {
    throw toApiError(error)
  }
}

