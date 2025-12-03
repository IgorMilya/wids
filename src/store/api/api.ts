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
  
  // Handle network errors gracefully for temp users
  if (result.error) {
    // Use api.getState() instead of importing store to avoid circular dependency
    const state = api.getState() as { user: { isTempUser: boolean } }
    const isTempUser = state.user.isTempUser
    
    // If temp user and network error, fail silently (don't show error toast)
    if (isTempUser && (result.error.status === 'FETCH_ERROR' || result.error.status === 'PARSING_ERROR')) {
      // Return a result that indicates the query was skipped
      return {
        error: {
          status: 'CUSTOM_ERROR',
          error: 'Network unavailable - using cached data',
        } as FetchBaseQueryError,
      }
    }
  }

  if (result.error && result.error.status === 401) {
    // Try to refresh the token
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
          
          // Update tokens in cookies
          cookieUtils.setToken(token)
          cookieUtils.setRefreshToken(refresh_token)
          
          // Dispatch custom event to update store (components listening will update Redux)
          window.dispatchEvent(new CustomEvent('tokensRefreshed', { detail: { token, refresh_token } }))
          
          // Retry the original query with new token
          result = await baseQuery(args, api, extraOptions)
        } else {
          // Refresh failed, logout user
          cookieUtils.removeTokens()
          window.dispatchEvent(new CustomEvent('authLogout'))
        }
      } catch (error) {
        // Refresh failed, logout user
        cookieUtils.removeTokens()
        window.dispatchEvent(new CustomEvent('authLogout'))
      }
    } else {
      // No refresh token, logout user
      cookieUtils.removeTokens()
      window.dispatchEvent(new CustomEvent('authLogout'))
    }
  }

  return result
}

export const api = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Blacklist', 'Whitelist', 'Logs', 'Profile', 'Analytics'], // Real-time monitoring feature - COMMENTED OUT (will be re-enabled in future) // 'Threats', 'MonitoringPreferences',
  endpoints: () => ({}),
})