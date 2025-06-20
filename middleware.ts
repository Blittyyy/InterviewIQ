import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
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

  try {
    const res = NextResponse.next()
    const supabase = createMiddlewareClient({ req: request, res })

    // Get the session
    const { data: { session } } = await supabase.auth.getSession()

    // If there's a session, ensure user exists in our database
    if (session?.user) {
      const { data: userData } = await supabase
        .from("users")
        .select("id")
        .eq("id", session.user.id)
        .single()

      // If user doesn't exist in our database, create them
      if (!userData) {
        await supabase.from("users").insert([
          {
            id: session.user.id,
            email: session.user.email,
            plan: "free",
            reports_generated: 0,
            daily_reports_count: 0,
            email_verified: true, // Since they're already authenticated
          },
        ])
      }
    }

    return res
  } catch (err) {
    console.error("Middleware error:", err)
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
} 