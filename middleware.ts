import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { rateLimit } from './lib/rate-limit'

export async function middleware(request: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req: request, res })

  // Refresh session if expired
  await supabase.auth.getSession()

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
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

  return res
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
    '/api/waitlist',
    '/api/waitlist/count'
  ],
}