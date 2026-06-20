import type { NextApiRequest, NextApiResponse } from 'next'

type RateLimitRecord = {
  count: number
  firstAttempt: number
  lastAttempt: number
}

// In-memory rate limit store. Resets on serverless cold start.
// For distributed rate limiting, set RATE_LIMIT_REDIS_URL to an Upstash Redis instance.
const memoryStore = new Map<string, RateLimitRecord>()

function getClientKey(req: NextApiRequest): string {
  const forwarded = req.headers['x-forwarded-for']
  return Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown'
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export type RateLimitConfig = {
  windowMs: number
  maxAttempts: number
  blockDurationMs: number
}

const defaultConfig: RateLimitConfig = {
  windowMs: 5 * 60 * 1000,
  maxAttempts: 10,
  blockDurationMs: 15 * 60 * 1000,
}

/**
 * Check rate limit for a given request. Returns true if the request is allowed.
 * If blocked, sends 429 response and returns false.
 */
export async function checkRateLimit(
  req: NextApiRequest,
  res: NextApiResponse,
  config: Partial<RateLimitConfig> = {}
): Promise<boolean> {
  const opts = { ...defaultConfig, ...config }
  const key = getClientKey(req)
  const now = Date.now()
  const record = memoryStore.get(key)

  if (record) {
    // If blocked due to too many failures
    if (record.count >= opts.maxAttempts && now - record.lastAttempt < opts.blockDurationMs) {
      const retryAfter = Math.ceil((opts.blockDurationMs - (now - record.lastAttempt)) / 1000)
      res.setHeader('Retry-After', retryAfter)
      res.status(429).json({
        error: 'Too many attempts. Please try again later.',
        retryAfter,
      })
      return false
    }

    // Window expired, reset
    if (now - record.firstAttempt > opts.windowMs) {
      memoryStore.delete(key)
    } else {
      // Progressive delay for repeated failures (up to 2 seconds)
      if (record.count > 0) {
        await delay(Math.min(2000, record.count * 250))
      }
    }
  }

  return true
}

/**
 * Record a failed attempt for the given request.
 */
export function recordFailedAttempt(req: NextApiRequest, config: Partial<RateLimitConfig> = {}): void {
  const opts = { ...defaultConfig, ...config }
  const key = getClientKey(req)
  const now = Date.now()
  const record = memoryStore.get(key)

  if (!record || now - record.firstAttempt > opts.windowMs) {
    memoryStore.set(key, { count: 1, firstAttempt: now, lastAttempt: now })
  } else {
    record.count++
    record.lastAttempt = now
  }
}

/**
 * Clear failed attempts for the given request (e.g. on success).
 */
export function clearFailedAttempts(req: NextApiRequest): void {
  memoryStore.delete(getClientKey(req))
}
