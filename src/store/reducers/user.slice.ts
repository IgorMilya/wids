import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { cookieUtils } from '../../utils/cookies'
import { jwtUtils } from '../../utils/jwt'

interface StoredUser {
  id: string
  username: string | null
}

interface UserState {
  user: StoredUser | null
  token: string | null
  refresh_token: string | null
}

// Initialize state from cookies and JWT token
const getInitialState = (): UserState => {
  const token = cookieUtils.getToken() || null
  const refresh_token = cookieUtils.getRefreshToken() || null
  
  // Extract user data from JWT token if available
  let user: StoredUser | null = null
  if (token) {
    const userId = jwtUtils.getUserId(token)
    const username = jwtUtils.getUsername(token)
    if (userId) {
      user = {
        id: userId,
        username: username || null,
      }
    }
  }
  
  return {
    user,
    token,
    refresh_token,
  }
}

const initialState: UserState = getInitialState()

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    loginUser: (
      state,
      action: PayloadAction<{ user: StoredUser; token: string; refresh_token: string }>
    ) => {
      state.token = action.payload.token
      state.refresh_token = action.payload.refresh_token

      // Store tokens in cookies (not localStorage)
      cookieUtils.setToken(action.payload.token)
      cookieUtils.setRefreshToken(action.payload.refresh_token)
      
      // Extract user data from JWT token as source of truth (don't store user data separately)
      const userId = jwtUtils.getUserId(action.payload.token)
      const username = jwtUtils.getUsername(action.payload.token)
      if (userId) {
        state.user = {
          id: userId,
          username: username || action.payload.user.username || null,
        }
      } else {
        // Fallback to action payload if JWT decode fails (shouldn't happen)
        state.user = action.payload.user
      }
    },

    setTokens: (
      state,
      action: PayloadAction<{ token: string; refresh_token: string }>
    ) => {
      state.token = action.payload.token
      state.refresh_token = action.payload.refresh_token

      // Store tokens in cookies
      cookieUtils.setToken(action.payload.token)
      cookieUtils.setRefreshToken(action.payload.refresh_token)
      
      // Extract user data from new JWT token
      const userId = jwtUtils.getUserId(action.payload.token)
      const username = jwtUtils.getUsername(action.payload.token)
      if (userId) {
        state.user = {
          id: userId,
          username: username || state.user?.username || null,
        }
      }
    },

    logoutUser: (state) => {
      state.user = null
      state.token = null
      state.refresh_token = null

      // Remove tokens from cookies
      cookieUtils.removeTokens()
    },
    updateUsername: (state, action: PayloadAction<string>) => {
      if (state.user) {
        state.user.username = action.payload
        // Don't store in localStorage, keep only in Redux state
      }
    },
  },
})

export const { loginUser, logoutUser, updateUsername, setTokens } = userSlice.actions
export default userSlice.reducer
