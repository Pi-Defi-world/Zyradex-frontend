/**
 * Request Cache with Deduplication
 * 
 * Prevents duplicate API requests by:
 * 1. Caching successful responses with TTL
 * 2. Deduplicating in-flight requests (reusing promises)
 * 3. Handling rate limit errors with exponential backoff
 */

interface CachedResponse<T> {
  data: T
  timestamp: number
  expiresAt: number
}

interface PendingRequest<T> {
  promise: Promise<T>
  timestamp: number
}

// In-memory cache for successful responses
const responseCache = new Map<string, CachedResponse<any>>()

// Map of in-flight requests to prevent duplicate calls
const pendingRequests = new Map<string, PendingRequest<any>>()

// Default cache TTL (5 minutes)
const DEFAULT_CACHE_TTL_MS = 5 * 60 * 1000

// Rate limit handling
const RATE_LIMIT_RETRY_DELAY_MS = 1000
const MAX_RETRIES = 3

/**
 * Creates a cache key from request parameters
 */
function createCacheKey(endpoint: string, params: Record<string, any>): string {
  // Normalize params by sorting keys and converting to stable string
  const normalized = Object.keys(params)
    .sort()
    .map(key => `${key}=${String(params[key]).toUpperCase()}`)
    .join('&')
  return `${endpoint}?${normalized}`
}

/**
 * Cleans up expired cache entries and stale pending requests
 */
function cleanup() {
  const now = Date.now()
  
  // Remove expired cache entries
  for (const [key, cached] of responseCache.entries()) {
    if (now > cached.expiresAt) {
      responseCache.delete(key)
    }
  }
  
  // Remove stale pending requests (older than 30 seconds)
  for (const [key, pending] of pendingRequests.entries()) {
    if (now - pending.timestamp > 30000) {
      pendingRequests.delete(key)
    }
  }
}

// Run cleanup every minute
if (typeof window !== 'undefined') {
  setInterval(cleanup, 60000)
}

/**
 * Cached API request with deduplication
 * 
 * @param key - Unique cache key for this request
 * @param requestFn - Function that performs the actual API request
 * @param options - Cache options
 * @returns Cached or fresh response
 */
export async function cachedRequest<T>(
  key: string,
  requestFn: () => Promise<T>,
  options: {
    ttl?: number // Time to live in milliseconds
    skipCache?: boolean // Skip cache lookup (still deduplicates)
  } = {}
): Promise<T> {
  const { ttl = DEFAULT_CACHE_TTL_MS, skipCache = false } = options
  const now = Date.now()

  // Check cache first (unless skipped)
  if (!skipCache) {
    const cached = responseCache.get(key)
    if (cached && now < cached.expiresAt) {
      return cached.data
    }
  }

  // Check if request is already in flight
  const pending = pendingRequests.get(key)
  if (pending) {
    // Reuse existing promise
    return pending.promise
  }

  // Create new request
  const executeRequest = async (retryCount = 0): Promise<T> => {
    try {
      const data = await requestFn()
      
      // Cache successful response
      responseCache.set(key, {
        data,
        timestamp: now,
        expiresAt: now + ttl,
      })
      
      // Remove from pending requests
      pendingRequests.delete(key)
      
      return data
    } catch (error: any) {
      // Handle rate limiting with exponential backoff
      if (error?.status === 429 || error?.response?.status === 429) {
        if (retryCount < MAX_RETRIES) {
          const delay = RATE_LIMIT_RETRY_DELAY_MS * Math.pow(2, retryCount)
          await new Promise(resolve => setTimeout(resolve, delay))
          return executeRequest(retryCount + 1)
        }
      }
      
      // Remove from pending requests on error
      pendingRequests.delete(key)
      
      throw error
    }
  }

  const promise = executeRequest()
  
  // Store pending request
  pendingRequests.set(key, {
    promise,
    timestamp: now,
  })

  return promise
}

/**
 * Clear cache for a specific key or all cache
 */
export function clearCache(key?: string) {
  if (key) {
    responseCache.delete(key)
    pendingRequests.delete(key)
  } else {
    responseCache.clear()
    pendingRequests.clear()
  }
}

/**
 * Pre-create cache key helper for consistent key generation
 */
export function createRequestKey(endpoint: string, params: Record<string, any>): string {
  return createCacheKey(endpoint, params)
}

