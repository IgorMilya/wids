import { api } from './api'
import { LogEntryType } from 'types'

export const logsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getLogs: builder.query<LogEntryType[], { ssid?: string; action?: string; date?: string } | void>({
      query: (params) => {
        let queryString = ''
        if (params) {
          const urlParams = new URLSearchParams()
          if (params.ssid) urlParams.append('ssid', params.ssid)
          if (params.action) urlParams.append('action', params.action)
          if (params.date) urlParams.append('date', params.date)
          queryString = `?${urlParams.toString()}`
        }
        return `/logs${queryString}`
      },
      providesTags: ['Logs'],
    }),

    addLog: builder.mutation<void, { network_ssid: string; network_bssid?: string; action: string; details?: string }>({
      query: (body) => ({
        url: '/logs',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Logs'],
    }),
  }),
})

export const { useGetLogsQuery, useAddLogMutation } = logsApi
