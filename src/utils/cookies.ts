import Cookies from 'js-cookie'

const TOKEN_COOKIE = 'auth_token'
const REFRESH_TOKEN_COOKIE = 'refresh_token'

// Cookie options - set secure and sameSite for production
const cookieOptions = {
  expires: 30, // 30 days
  secure: import.meta.env.PROD, // Only send over HTTPS in production
  sameSite: 'strict' as const,
  path: '/',
}

export const cookieUtils = {
  setToken: (token: string) => {
    Cookies.set(TOKEN_COOKIE, token, cookieOptions)
  },
  
  getToken: (): string | undefined => {
    return Cookies.get(TOKEN_COOKIE)
  },
  
  setRefreshToken: (refreshToken: string) => {
    Cookies.set(REFRESH_TOKEN_COOKIE, refreshToken, cookieOptions)
  },
  
  getRefreshToken: (): string | undefined => {
    return Cookies.get(REFRESH_TOKEN_COOKIE)
  },
  
  removeTokens: () => {
    Cookies.remove(TOKEN_COOKIE, { path: '/' })
    Cookies.remove(REFRESH_TOKEN_COOKIE, { path: '/' })
  },
}

