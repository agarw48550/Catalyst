import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const protectedRoutes = ['/dashboard', '/resume', '/interview', '/jobs', '/research', '/settings']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route))
  if (!isProtected) return NextResponse.next()

  // Check for Supabase session cookie (sb-*-auth-token)
  const hasSession = request.cookies.getAll().some(
    (cookie) => cookie.name.startsWith('sb-') && cookie.name.endsWith('-auth-token')
  )

  if (!hasSession) {
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/resume/:path*', '/interview/:path*', '/jobs/:path*', '/research/:path*', '/settings/:path*'],
}
