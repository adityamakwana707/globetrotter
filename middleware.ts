import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { addSecurityHeaders, rateLimit, getCSPHeader } from "./lib/middleware"

export default withAuth(
  function middleware(request: NextRequest) {
    // Rate limiting for API routes
    if (request.nextUrl.pathname.startsWith('/api/')) {
      const rateLimitResponse = rateLimit(request, 100, 15 * 60 * 1000) // 100 requests per 15 minutes
      if (rateLimitResponse) {
        return rateLimitResponse
      }
    }

    // Admin route protection
    const token = request.nextauth.token
    const isAdmin = token?.role === 'admin'
    
    // If admin tries to access user routes, redirect to admin dashboard
    if (isAdmin && (
      request.nextUrl.pathname.startsWith('/dashboard') ||
      request.nextUrl.pathname.startsWith('/trips/') ||
      request.nextUrl.pathname === '/landing'
    )) {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
    
    // If non-admin tries to access admin routes, redirect to dashboard
    if (!isAdmin && request.nextUrl.pathname.startsWith('/admin')) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // Create response
    const response = NextResponse.next()

    // Add security headers
    addSecurityHeaders(response)
    
    // Add CSP header
    response.headers.set('Content-Security-Policy', getCSPHeader())

    return response
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Protect API routes
        if (req.nextUrl.pathname.startsWith('/api/')) {
          // Allow auth endpoints
          if (req.nextUrl.pathname.startsWith('/api/auth/')) {
            return true
          }
          // Allow public search endpoints
          if (req.nextUrl.pathname === '/api/cities' || 
              req.nextUrl.pathname.startsWith('/api/cities/') ||
              req.nextUrl.pathname === '/api/activities' ||
              req.nextUrl.pathname.startsWith('/api/activities/')) {
            return true
          }
          // Allow reading community posts for everyone
          if (req.nextUrl.pathname === '/api/community/posts' && req.method === 'GET') {
            return true
          }
          // Allow reading individual community posts for everyone
          if (req.nextUrl.pathname.startsWith('/api/community/posts/') && 
              req.nextUrl.pathname.match(/^\/api\/community\/posts\/\d+$/) && 
              req.method === 'GET') {
            return true
          }
          // Require authentication for other API routes
          return !!token
        }
        
        // Protect dashboard, trip, admin, and community pages
        if (req.nextUrl.pathname.startsWith('/dashboard') || 
            req.nextUrl.pathname.startsWith('/trips/') ||
            req.nextUrl.pathname.startsWith('/admin') ||
            req.nextUrl.pathname.startsWith('/community/create')) {
          return !!token
        }
        
        return true
      },
    },
  }
)

export const config = {
  matcher: [
    '/api/auth/:path*',
    '/api/dashboard/:path*',
    '/api/trips/:path*',
    '/api/admin/:path*',
    '/api/upload/:path*',
    '/api/test-db/:path*',
    '/dashboard/:path*',
    '/trips/:path*',
    '/admin/:path*',
    '/community/create/:path*',
    '/landing'
  ]
}
