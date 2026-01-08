import { api } from './api'
import { BlacklistedNetworkType } from 'types'


const blacklistApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getBlacklist: builder.query<BlacklistedNetworkType[], { ssid?: string; date?: string } | void>({
      query: (params) => {
        let queryString = ''
        if (params) {
          const urlParams = new URLSearchParams()
          if (params.ssid) urlParams.append('ssid', params.ssid)
          if (params.date) urlParams.append('date', params.date)
          queryString = `?${urlParams.toString()}`
        }

        return `/blacklist${queryString}`
      },
      providesTags: ['Blacklist'],
    }),
    addBlacklist: builder.mutation<void, { ssid: string; bssid: string; reason?: string }>({
      query: (body) => ({
        url: '/blacklist',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Blacklist'],
    }),
    deleteBlacklist: builder.mutation<void, string>({
      query: (id) => ({
        url: `/blacklist/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Blacklist'],
    }),
  }),
})

export const { useGetBlacklistQuery, useAddBlacklistMutation, useDeleteBlacklistMutation } = blacklistApi

