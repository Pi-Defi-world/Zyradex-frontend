// Utility functions for formatting

export function formatCurrency(value: number | string): string {
  const num = typeof value === "string" ? Number.parseFloat(value) : value
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(num)
}

export function formatNumber(value: number | string): string {
  const num = typeof value === "string" ? Number.parseFloat(value) : value
  return new Intl.NumberFormat("en-US").format(num)
}

export function formatAddress(address: string, chars = 4): string {
  return `${address.slice(0, chars)}...${address.slice(-chars)}`
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(d)
}
