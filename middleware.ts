import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createSupabaseMiddlewareClient } from '@/lib/supabase-server'

const protectedRoutes = ['/dashboard', '/resume', '/interview', '/jobs', '/research', '/settings']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route))
  if (!isProtected) return NextResponse.next()

  // Use @supabase/ssr server client to read & refresh auth cookies
  const { supabase, response } = createSupabaseMiddlewareClient(request)

  // getUser() validates the JWT server-side and refreshes expired tokens
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // IMPORTANT: return the supabase response so refreshed cookies are set
  return response
}

export const config = {
  matcher: ['/dashboard/:path*', '/resume/:path*', '/interview/:path*', '/jobs/:path*', '/research/:path*', '/settings/:path*'],
}
