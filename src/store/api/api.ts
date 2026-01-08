import { createApi, fetchBaseQuery, BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query/react'
import { cookieUtils } from '../../utils/cookies'

const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_BASE_URL,
  prepareHeaders: (headers) => {
    const token = cookieUtils.getToken()
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    return headers
  },
})

const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions)
  
  if (result.error) {
    const state = api.getState() as { user: { isTempUser: boolean } }
    const isTempUser = state.user.isTempUser
    
    if (isTempUser && (result.error.status === 'FETCH_ERROR' || result.error.status === 'PARSING_ERROR')) {
      return {
        error: {
          status: 'CUSTOM_ERROR',
          error: 'Network unavailable - using cached data',
        } as FetchBaseQueryError,
      }
    }
  }

  const url = typeof args === 'string' ? args : args.url
  const isAuthEndpoint = typeof url === 'string' && (url.startsWith('/auth/login') || url.startsWith('/auth/register') || url.startsWith('/auth/reset'))
  console.log('isAuthEndpoint 1', isAuthEndpoint);

  if (result.error && result.error.status === 401 && !isAuthEndpoint) {
    console.log('isAuthEndpoint 2', isAuthEndpoint);
    const refreshToken = cookieUtils.getRefreshToken()
    
    if (refreshToken) {
      try {
        const refreshResult = await baseQuery(
          {
            url: '/auth/refresh',
            method: 'POST',
            body: { refresh_token: refreshToken },
          },
          api,
          extraOptions
        )

        if (refreshResult.data) {
          const { token, refresh_token } = refreshResult.data as { token: string; refresh_token: string }
          
          cookieUtils.setToken(token)
          cookieUtils.setRefreshToken(refresh_token)
          
          window.dispatchEvent(new CustomEvent('tokensRefreshed', { detail: { token, refresh_token } }))
          
          result = await baseQuery(args, api, extraOptions)
        } else {
          cookieUtils.removeTokens()
          window.dispatchEvent(new CustomEvent('authLogout'))
        }
      } catch (error) {
        cookieUtils.removeTokens()
        window.dispatchEvent(new CustomEvent('authLogout'))
      }
    } else {
      cookieUtils.removeTokens()
      window.dispatchEvent(new CustomEvent('authLogout'))
    }
  }

  return result
}

export const api = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Blacklist', 'Whitelist', 'Logs', 'Profile'],
  endpoints: () => ({}),
})