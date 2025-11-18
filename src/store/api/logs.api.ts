import { api } from './api'
import { LogEntryType } from 'types'

export const logsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getLogs: builder.query<
      { total: number; logs: LogEntryType[] },
      {
        ssid?: string
        action?: string
        date?: string
        date_from?: string
        date_till?: string
        limit: number
        page: number
      } | void
    >({
      query: (params) => {
        let queryString = ''
        if (params) {
          const urlParams = new URLSearchParams()
          if (params.ssid) urlParams.append('ssid', params.ssid)
          if (params.action) urlParams.append('action', params.action)
          if (params.date) urlParams.append('date', params.date)
          if (params.date_from) urlParams.append('date_from', params.date_from)
          if (params.date_till) urlParams.append('date_till', params.date_till)
          if (params.page) urlParams.append('page', params.page.toString())
          if (params.limit) urlParams.append('limit', params.limit.toString())
          queryString = `?${urlParams.toString()}`
        }
        return `/logs${queryString}`
      },
      providesTags: ['Logs'],
    }),

    exportLogs: builder.query<
      { total: number; logs: LogEntryType[] },
      {
        ssid?: string
        action?: string
        date?: string
        date_from?: string
        date_till?: string
      } | void
    >({
      query: (params) => {
        let queryString = ''
        if (params) {
          const urlParams = new URLSearchParams()
          if (params.ssid) urlParams.append('ssid', params.ssid)
          if (params.action) urlParams.append('action', params.action)
          if (params.date) urlParams.append('date', params.date)
          if (params.date_from) urlParams.append('date_from', params.date_from)
          if (params.date_till) urlParams.append('date_till', params.date_till)
          queryString = `?${urlParams.toString()}`
        }
        return `/logs/export${queryString}`
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

export const { 
  useGetLogsQuery, 
  useExportLogsQuery,
  useLazyExportLogsQuery,
  useAddLogMutation 
} = logsApi
