// Rate limiting utility for password reset
// This is an optional enhancement for production environments

interface RateLimitConfig {
  windowMs: number    // Time window in milliseconds
  maxRequests: number // Maximum requests per window
}

interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

class MemoryRateLimit {
  private store: RateLimitStore = {}
  private config: RateLimitConfig

  constructor(config: RateLimitConfig) {
    this.config = config
    
    // Clean up expired entries every 5 minutes
    setInterval(() => {
      const now = Date.now()
      Object.keys(this.store).forEach(key => {
        if (this.store[key].resetTime <= now) {
          delete this.store[key]
        }
      })
    }, 5 * 60 * 1000)
  }

  isAllowed(identifier: string): boolean {
    const now = Date.now()
    const entry = this.store[identifier]

    if (!entry || entry.resetTime <= now) {
      // Reset or create new entry
      this.store[identifier] = {
        count: 1,
        resetTime: now + this.config.windowMs
      }
      return true
    }

    if (entry.count >= this.config.maxRequests) {
      return false
    }

    entry.count++
    return true
  }

  getRemainingTime(identifier: string): number {
    const entry = this.store[identifier]
    if (!entry) return 0
    
    const remaining = entry.resetTime - Date.now()
    return Math.max(0, remaining)
  }
}

// Rate limiters for different scenarios
export const forgotPasswordRateLimit = new MemoryRateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 3             // 3 requests per hour per email
})

export const resetPasswordRateLimit = new MemoryRateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes  
  maxRequests: 5             // 5 attempts per 15 minutes per IP
})

// Usage in API routes:
/*
const clientIP = request.headers.get('x-forwarded-for') || 'unknown'
if (!resetPasswordRateLimit.isAllowed(clientIP)) {
  const remainingTime = Math.ceil(resetPasswordRateLimit.getRemainingTime(clientIP) / 1000 / 60)
  return NextResponse.json(
    { message: `Too many attempts. Try again in ${remainingTime} minutes.` },
    { status: 429 }
  )
}
*/
