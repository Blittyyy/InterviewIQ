import { Redis } from '@upstash/redis'

let redis: Redis | null = null

try {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  })
} catch (error) {
  console.error('Failed to initialize Redis:', error)
}

export async function rateLimit({
  key,
  windowSeconds,
  maxRequests,
}: {
  key: string
  windowSeconds: number
  maxRequests: number
}): Promise<{ allowed: boolean; remaining: number }> {
  // If Redis is not available, allow the request
  if (!redis) {
    console.warn('Redis not available, rate limiting disabled')
    return { allowed: true, remaining: maxRequests }
  }

  try {
    const now = Math.floor(Date.now() / 1000)
    const windowKey = `ratelimit:${key}:${Math.floor(now / windowSeconds)}`

    // Increment the count for this window
    const count = await redis.incr(windowKey)
    if (count === 1) {
      // Set expiry if first request in window
      await redis.expire(windowKey, windowSeconds)
    }
    return {
      allowed: count <= maxRequests,
      remaining: Math.max(0, maxRequests - count),
    }
  } catch (error) {
    console.error('Rate limiting error:', error)
    // If there's an error with Redis, allow the request
    return { allowed: true, remaining: maxRequests }
  }
} 