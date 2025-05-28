import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

export async function rateLimit({
  key,
  windowSeconds,
  maxRequests,
}: {
  key: string
  windowSeconds: number
  maxRequests: number
}): Promise<{ allowed: boolean; remaining: number }> {
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
} 