import { api } from './api'

export interface UserProfile {
  id: string
  profiling_preference: string
  speed_network_preference: string
  confidence_level: string
  profile_type: string
  preferred_authentication: string[]
  min_signal_strength: number | null
  max_risk_level: string | null
}

export interface UpdateProfileRequest {
  profiling_preference?: string
  speed_network_preference?: string
  confidence_level?: string
  profile_type?: string
  preferred_authentication?: string[]
  min_signal_strength?: number
  max_risk_level?: string
}

export const profile = api.injectEndpoints({
  endpoints: (builder) => ({
    getProfile: builder.query<UserProfile, void>({
      query: () => '/profile',
      providesTags: ['Profile'],
    }),
    updateProfile: builder.mutation<{ status: string }, UpdateProfileRequest>({
      query: (data) => ({
        url: '/profile',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Profile', 'Analytics'],
    }),
    changeUsername: builder.mutation<
      { status: string; username: string; token: string; refresh_token: string },
      { username: string }
    >({
      query: (data) => ({
        url: '/profile/username',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Profile', 'Analytics'],
    }),
    changePassword: builder.mutation<
      { status: string },
      { current_password: string; new_password: string }
    >({
      query: (data) => ({
        url: '/profile/password',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Analytics'],
    }),
  }),
})

export const {
  useGetProfileQuery,
  useUpdateProfileMutation,
  useChangeUsernameMutation,
  useChangePasswordMutation,
} = profile

