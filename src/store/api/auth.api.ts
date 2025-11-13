// authApi.ts
import { api } from './api'

export const auth = api.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<
      { token: string; user_id: string; username: string },
      { username: string; password: string } // argument type
    >({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
    }),
  }),
  overrideExisting: false, // ensures multiple injectEndpoints calls are safe
})

// ✅ export hooks from the injected API object
export const { useLoginMutation } = auth;
