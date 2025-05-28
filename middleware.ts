import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { rateLimit } from './lib/rate-limit'

export async function middleware(request: NextRequest) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown'

  const { pathname } = request.nextUrl

  // Rate limit rules
  if (pathname.startsWith('/api/waitlist/count')) {
    const { allowed } = await rateLimit({
      key: `waitlist-count:${ip}`,
      windowSeconds: 60,
      maxRequests: 20,
    })
    if (!allowed) {
      return new NextResponse('Too many requests to waitlist count', { status: 429 })
    }
  } else if (pathname.startsWith('/api/waitlist')) {
    const { allowed } = await rateLimit({
      key: `waitlist-join:${ip}`,
      windowSeconds: 60 * 60, // 1 hour
      maxRequests: 5,
    })
    if (!allowed) {
      return new NextResponse('Too many waitlist join attempts', { status: 429 })
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/api/waitlist', '/api/waitlist/count'],
} 