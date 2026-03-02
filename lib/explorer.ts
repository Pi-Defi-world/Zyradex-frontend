/**
 * Transaction explorer URLs for Pi Network blockchain.
 * Uses the Horizon API transaction endpoint (works for both testnet and mainnet).
 * See: https://api.testnet.minepi.com/ - transaction link format
 */

const PI_TESTNET_TRANSACTIONS = "https://api.testnet.minepi.com/transactions"
const PI_MAINNET_TRANSACTIONS = "https://api.mainnet.minepi.com/transactions"

function getTransactionsBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_HORIZON_URL
  if (url && url.includes("mainnet.minepi.com")) {
    return PI_MAINNET_TRANSACTIONS
  }
  return PI_TESTNET_TRANSACTIONS
}

/**
 * Returns the URL to view a transaction on the Pi blockchain explorer (Horizon API).
 * Opens in a new tab when used with window.open(url, "_blank").
 */
export function getTransactionExplorerUrl(hash: string): string {
  if (!hash?.trim()) return ""
  const base = getTransactionsBaseUrl()
  return `${base}/${encodeURIComponent(hash.trim())}`
}

/** Opens the transaction in a new tab. */
export function viewTransactionOnExplorer(hash: string): void {
  const url = getTransactionExplorerUrl(hash)
  if (url) window.open(url, "_blank", "noopener,noreferrer")
}
