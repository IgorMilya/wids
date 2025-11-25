/**
 * Decode JWT token and extract claims
 * Note: This only decodes the token without verification
 * The backend should always verify the token signature
 */
interface JWTClaims {
  sub: string // user_id
  exp: number // expiration timestamp
  username?: string // optional username
}

export const jwtUtils = {
  /**
   * Decode JWT token and return claims
   */
  decode: (token: string): JWTClaims | null => {
    try {
      const base64Url = token.split('.')[1]
      if (!base64Url) return null
      
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      )
      
      return JSON.parse(jsonPayload) as JWTClaims
    } catch (error) {
      console.error('Failed to decode JWT:', error)
      return null
    }
  },
  
  /**
   * Extract user_id from JWT token
   */
  getUserId: (token: string): string | null => {
    const claims = jwtUtils.decode(token)
    return claims?.sub || null
  },
  
  /**
   * Extract username from JWT token (if available)
   */
  getUsername: (token: string): string | null => {
    const claims = jwtUtils.decode(token)
    return claims?.username || null
  },
  
  /**
   * Check if token is expired
   */
  isExpired: (token: string): boolean => {
    const claims = jwtUtils.decode(token)
    if (!claims || !claims.exp) return true
    
    const currentTime = Math.floor(Date.now() / 1000)
    return claims.exp < currentTime
  },
}

