"use client"

import { useUserProfile } from "@/hooks/useUserProfile"

/**
 * Current authenticated user (Pi + backend sign-in).
 * Use for user-scoped API calls (savings, lending, invest, dashboard).
 */
export function useCurrentUser() {
  const { profile } = useUserProfile()
  return { user: profile }
}
