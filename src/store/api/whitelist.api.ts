import { api } from './api'
import { WhitelistedNetworkType } from 'types'


const whitelistApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getWhitelist: builder.query<WhitelistedNetworkType[], { ssid?: string; date?: string } | void>({
      query: (params) => {
        let queryString = ''
        if (params) {
          const urlParams = new URLSearchParams()
          if (params.ssid) urlParams.append('ssid', params.ssid)
          if (params.date) urlParams.append('date', params.date)
          queryString = `?${urlParams.toString()}`
        }

        return `/whitelist${queryString}`
      },
      providesTags: ['Whitelist'],
    }),

    addWhitelist: builder.mutation<void, { ssid: string; bssid: string }>({
      query: (body) => ({
        url: '/whitelist',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Whitelist'],
    }),
    deleteWhitelist: builder.mutation<void, string>({
      query: (id) => ({
        url: `/whitelist/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Whitelist'],
    }),
  }),
})

export const { useGetWhitelistQuery, useDeleteWhitelistMutation, useAddWhitelistMutation } = whitelistApi

