import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface StoredUser {
  id: string
  username: string | null
}

interface UserState {
  user: StoredUser | null
  token: string | null
}

const initialState: UserState = {
  user: JSON.parse(localStorage.getItem("user") || "null"),
  token: localStorage.getItem("token"),
}

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    loginUser: (
      state,
      action: PayloadAction<{ user: StoredUser; token: string }>
    ) => {
      state.user = action.payload.user
      state.token = action.payload.token

      localStorage.setItem("user", JSON.stringify(action.payload.user))
      localStorage.setItem("token", action.payload.token)
    },

    logoutUser: (state) => {
      state.user = null
      state.token = null

      localStorage.removeItem("user")
      localStorage.removeItem("token")
    },
    updateUsername: (state, action: PayloadAction<string>) => {
      if (state.user) {
        state.user.username = action.payload
        localStorage.setItem("user", JSON.stringify(state.user))
      }
    },
  },
})

export const { loginUser, logoutUser, updateUsername } = userSlice.actions
export default userSlice.reducer
