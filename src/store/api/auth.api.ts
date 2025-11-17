import { api } from './api'

export const auth = api.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<
      { token: string; user_id: string; username?: string },
      { email: string; password: string }
    >({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
    }),
    verifyEmail: builder.mutation<
      { verified: boolean; token: string; user_id: string; username?: string },
      { email: string; code: string }
    >({
      query: (data) => ({
        url: '/auth/verify',
        method: 'POST',
        body: data,
      }),
    }),
    resendVerification: builder.mutation<
      { status: string },
      { email: string }
    >({
      query: (data) => ({
        url: '/auth/resend-verification',
        method: 'POST',
        body: data,
      }),
    }),
    register: builder.mutation<
      { status: string; existing: boolean },
      { email: string; password: string }
    >({
      query: (data) => ({
        url: '/auth/register',
        method: 'POST',
        body: data,
      }),
    }),
    resetPasswordRequest: builder.mutation<{ status: string }, { email: string }>({
      query: (data) => ({
        url: '/auth/reset/request',
        method: 'POST',
        body: data,
      }),
    }),
    resetPasswordConfirm: builder.mutation<
      { status: string },
      { email: string; code: string; new_password: string }
    >({
      query: (data) => ({
        url: '/auth/reset/confirm',
        method: 'POST',
        body: data,
      }),
    }),
  }),
})

export const {
  useLoginMutation,
  useRegisterMutation,
  useVerifyEmailMutation,
  useResendVerificationMutation,
  useResetPasswordRequestMutation,
  useResetPasswordConfirmMutation,
} = auth
