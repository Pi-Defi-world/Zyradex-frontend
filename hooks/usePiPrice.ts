import { useState, useEffect } from "react"

interface PiPriceResponse {
  price?: number
  usd?: number
  timestamp?: number
}

export const usePiPrice = () => {
  const [price, setPrice] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let cancelled = false

    const fetchPrice = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // Try the main price endpoint first
        const response = await fetch("https://www.zyrachain.org/api/v1/price")
        
        if (!response.ok) {
          // Fallback to pi-price endpoint
          const fallbackResponse = await fetch("https://www.zyrachain.org/data/pi-price")
          if (!fallbackResponse.ok) {
            throw new Error("Failed to fetch Pi price")
          }
          const fallbackData = await fallbackResponse.json()
          if (!cancelled) {
            const priceValue = fallbackData.price || fallbackData.usd || fallbackData.value || null
            setPrice(priceValue)
            setIsLoading(false)
          }
          return
        }

        const data = await response.json()
        
        if (!cancelled) {
          // Handle different possible response formats
          const priceValue = 
            data.price || 
            data.usd || 
            data.value || 
            (typeof data === 'number' ? data : null) ||
            (data.data?.price) ||
            (data.data?.usd) ||
            null
          setPrice(priceValue)
          setIsLoading(false)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error("Failed to fetch Pi price"))
          setIsLoading(false)
        }
      }
    }

    fetchPrice()

    // Refresh price every 1 minutes
    const interval = setInterval(fetchPrice, 1 * 60 * 1000)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  return { price, isLoading, error }
}

