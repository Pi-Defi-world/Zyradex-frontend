// Mock API utilities for future backend integration

export const API_BASE_URL = "/api"

export async function mintToken(data: {
  issuerSecret: string
  distributorPub: string
  assetCode: string
  amount: string
}) {
  // Mock API call - replace with actual backend call later
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        transactionId: "mock-tx-" + Math.random().toString(36).substr(2, 9),
        data,
      })
    }, 1000)
  })
}

export async function establishTrustline(data: {
  userSecret: string
  assetCode: string
  issuer: string
  limit: string
}) {
  // Mock API call - replace with actual backend call later
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        transactionId: "mock-tx-" + Math.random().toString(36).substr(2, 9),
        data,
      })
    }, 1000)
  })
}

export async function getBalance(publicKey: string) {
  // Mock API call
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        balances: [
          { asset: "PI", balance: "1234.56" },
          { asset: "PIUSD", balance: "5000.00" },
        ],
      })
    }, 500)
  })
}
