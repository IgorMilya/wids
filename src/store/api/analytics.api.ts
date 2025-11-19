import { api } from './api'

export interface AnalyticsResponse {
  security_metrics: SecurityMetrics
  connection_stats: ConnectionStats
  blacklist_whitelist: BlacklistWhitelistStats
  user_activity: UserActivityStats
  network_stats: NetworkStats
  time_series: TimeSeriesData
}

export interface SecurityMetrics {
  high_risk_connections: number
  medium_risk_connections: number
  low_risk_connections: number
  failed_attempts: number
  successful_connections: number
}

export interface ConnectionStats {
  total_connections: number
  connection_success_rate: number
  total_scan_attempts: number
  avg_connections_per_day: number
}

export interface BlacklistWhitelistStats {
  total_blacklisted: number
  total_whitelisted: number
  blacklist_additions: number
  blacklist_removals: number
  whitelist_additions: number
  whitelist_removals: number
  blacklist_additions_today: number
  blacklist_removals_today: number
  whitelist_additions_today: number
  whitelist_removals_today: number
  blacklist_additions_week: number
  blacklist_removals_week: number
  whitelist_additions_week: number
  whitelist_removals_week: number
  blacklist_additions_month: number
  blacklist_removals_month: number
  whitelist_additions_month: number
  whitelist_removals_month: number
}

export interface UserActivityStats {
  password_changes: number
  username_changes: number
  profile_updates: number
  profile_save_attempts: number
}

export interface NetworkStats {
  most_scanned_networks: NetworkScanCount[]
  unique_networks_scanned: number
}

export interface NetworkScanCount {
  ssid: string
  scan_count: number
}

export interface TimeSeriesData {
  daily_activity: DailyActivity[]
  hourly_activity: HourlyActivity[]
}

export interface DailyActivity {
  date: string
  scans: number
  connections: number
  blacklist_adds: number
  whitelist_adds: number
}

export interface HourlyActivity {
  hour: number
  activity_count: number
}

export const analyticsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getAnalytics: builder.query<AnalyticsResponse, void>({
      query: () => '/analytics',
      providesTags: ['Analytics'],
    }),
  }),
})

export const { useGetAnalyticsQuery } = analyticsApi

