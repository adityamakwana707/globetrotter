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
          // Require authentication for other API routes
          return !!token
        }
        
        // Protect dashboard, trip, and admin pages
        if (req.nextUrl.pathname.startsWith('/dashboard') || 
            req.nextUrl.pathname.startsWith('/trips/') ||
            req.nextUrl.pathname.startsWith('/admin')) {
          return !!token
        }
        
        return true
      },
    },
  }
)

export const config = {
  matcher: [
    '/api/:path*',
    '/dashboard/:path*',
    '/trips/:path*',
    '/admin/:path*',
    '/landing'
  ]
}
