import { api } from './api'

//TODO
export interface AnalyticsResponse {
  security_metrics: SecurityMetrics
  connection_stats: ConnectionStats
  blacklist_whitelist: BlacklistWhitelistStats
  user_activity: UserActivityStats
  network_stats: NetworkStats
  time_series: TimeSeriesData
  threat_analytics: ThreatAnalytics
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

export interface ThreatAnalytics {
  threats_over_time: ThreatsOverTime
  threat_type_distribution: ThreatTypeDistribution
  channel_usage: ChannelUsage
  top_suspicious_networks: TopSuspiciousNetwork[]
}

export interface ThreatsOverTime {
  daily: ThreatTimePoint[]
  weekly: ThreatTimePoint[]
  monthly: ThreatTimePoint[]
  by_type: ThreatTypeTimePoint[]
}

export interface ThreatTimePoint {
  date: string
  total_threats: number
}

export interface ThreatTypeTimePoint {
  date: string
  threat_type: string
  count: number
}

export interface ThreatTypeDistribution {
  rogue_aps: number
  evil_twins: number
  suspicious_open_networks: number
  weak_encryption: number
  deauth_attacks: number
  mac_spoof_attempts: number
  blacklisted_networks_detected: number
}

export interface ChannelUsage {
  channel_1: number
  channel_6: number
  channel_11: number
  channels_5ghz: Channel5Ghz[]
}

export interface Channel5Ghz {
  channel: number
  count: number
}

export interface TopSuspiciousNetwork {
  ssid: string
  bssid: string
  risk_score: string
  threat_count: number
}

export const analyticsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getAnalytics: builder.query<AnalyticsResponse, { threatDateFilter?: 'day' | 'week' | 'month' | 'year' | 'all' } | void>({
      query: (params) => {
        const queryParams = new URLSearchParams()
        if (params?.threatDateFilter) {
          queryParams.append('threat_date_filter', params.threatDateFilter)
        }
        const queryString = queryParams.toString()
        return `/analytics${queryString ? `?${queryString}` : ''}`
      },
      providesTags: ['Analytics'],
      keepUnusedDataFor: 300, 
    }),
  }),
})

export const { useGetAnalyticsQuery } = analyticsApi

