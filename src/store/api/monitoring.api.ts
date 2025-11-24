// Real-time monitoring feature - COMMENTED OUT (will be re-enabled in future)

// import { api } from './api'

// export interface ThreatAlert {
//   threat_type: string
//   severity: string
//   network_ssid: string
//   network_bssid: string
//   details: string
//   timestamp: string
// }

// export interface Threat {
//   id: string
//   threat_type: string
//   severity: string
//   network_ssid: string
//   network_bssid: string
//   details: string
//   timestamp: string
//   acknowledged: boolean
// }

// export interface ThreatsResponse {
//   threats: Threat[]
// }

// export interface MonitoringPreferences {
//   id: string
//   enabled: boolean
//   interval_seconds: number
//   alert_types: string[]
//   updated_at: string
// }

// export interface UpdateMonitoringPreferencesRequest {
//   enabled?: boolean
//   interval_seconds?: number
//   alert_types?: string[]
// }

// export interface StartMonitoringRequest {
//   server_url: string
//   auth_token: string
//   interval_seconds: number
//   enabled_threat_types: string[]
//   whitelist: string[]
//   blacklist: string[]
// }

// export const monitoringApi = api.injectEndpoints({
//   endpoints: (builder) => ({
//     getThreats: builder.query<ThreatsResponse, { severity?: string; threat_type?: string; acknowledged?: boolean; date_from?: string; date_till?: string; limit?: number } | void>({
//       query: (params) => {
//         const queryParams = new URLSearchParams()
//         if (params?.severity) queryParams.append('severity', params.severity)
//         if (params?.threat_type) queryParams.append('threat_type', params.threat_type)
//         if (params?.acknowledged !== undefined) queryParams.append('acknowledged', params.acknowledged.toString())
//         if (params?.date_from) queryParams.append('date_from', params.date_from)
//         if (params?.date_till) queryParams.append('date_till', params.date_till)
//         if (params?.limit) queryParams.append('limit', params.limit.toString())
//         const queryString = queryParams.toString()
//         return `/threats${queryString ? `?${queryString}` : ''}`
//       },
//       providesTags: ['Threats'],
//     }),

//     getMonitoringPreferences: builder.query<MonitoringPreferences, void>({
//       query: () => '/monitoring/preferences',
//       providesTags: ['MonitoringPreferences'],
//     }),

//     updateMonitoringPreferences: builder.mutation<
//       { status: string },
//       UpdateMonitoringPreferencesRequest
//     >({
//       query: (data) => ({
//         url: '/monitoring/preferences',
//         method: 'POST',
//         body: data,
//       }),
//       invalidatesTags: ['MonitoringPreferences'],
//     }),
//   }),
// })

// export const {
//   useGetThreatsQuery,
//   useGetMonitoringPreferencesQuery,
//   useUpdateMonitoringPreferencesMutation,
// } = monitoringApi

// Placeholder exports to prevent import errors
// export const useGetThreatsQuery = () => ({ data: { threats: [] }, isLoading: false, error: null })
// export const useGetMonitoringPreferencesQuery = () => ({ data: null, isLoading: false, error: null })
// export const useUpdateMonitoringPreferencesMutation = () => [{ unwrap: async () => ({ status: 'ok' }) }]
