import {useState, useRef, useEffect, memo} from 'react'
import { useGetAnalyticsQuery } from 'store/api'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Filler,
} from 'chart.js'

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Filler
)

import { RiskLevelChart, ConnectionStatusChart, ThreatTypeChart, ChannelUsageChart, BlacklistWhitelistChart } from 'components'


const Analytics = memo(() => {
  const [threatDateFilter, setThreatDateFilter] = useState<'day' | 'week' | 'month' | 'year' | 'all'>('all')
  
  const hasLoadedDataRef = useRef(false)
  
  const { data, isLoading, isError } = useGetAnalyticsQuery(
    { threatDateFilter },
    {
      refetchOnMountOrArgChange: true,
      refetchOnFocus: false,
      refetchOnReconnect: false,
    }
  )
  
  useEffect(() => {
    if (data) {
      hasLoadedDataRef.current = true
    }
  }, [data])

  if (isLoading && !data && !hasLoadedDataRef.current) {
    return (
      <div className="p-3 small-laptop:p-4 normal-laptop:p-5 w-full flex items-center justify-center min-h-screen">
        <div className="text-lg small-laptop:text-xl">Loading analytics...</div>
      </div>
    )
  }

  if (isError && !data) {
    return (
      <div className="p-3 small-laptop:p-4 normal-laptop:p-5 w-full flex items-center justify-center min-h-screen">
        <div className="text-lg small-laptop:text-xl text-red-500">Failed to load analytics</div>
      </div>
    )
  }

  if (!data) {
    return null
  }

  const { security_metrics, connection_stats, blacklist_whitelist, user_activity, network_stats } = data

  return (
    <div className="p-3 small-laptop:p-4 normal-laptop:p-5 w-full max-w-full large-laptop:max-w-7xl mx-auto">
      <h1 className="text-xl small-laptop:text-2xl normal-laptop:text-3xl font-bold mb-4 small-laptop:mb-5 normal-laptop:mb-6 text-gray-800">Analytics Dashboard</h1>

      <div className="grid grid-cols-1 small-laptop:grid-cols-2 normal-laptop:grid-cols-2 large-laptop:grid-cols-4 gap-3 small-laptop:gap-4 mb-6 small-laptop:mb-8" data-tour="analytics-summary">
        <div className="bg-white p-4 small-laptop:p-5 normal-laptop:p-6 rounded-lg shadow-md border-l-4 border-blue-500">
          <h3 className="text-gray-600 text-xs small-laptop:text-sm font-medium mb-1 small-laptop:mb-2">Total Scans</h3>
          <p className="text-2xl small-laptop:text-3xl font-bold text-gray-800">{connection_stats.total_scan_attempts}</p>
          <p className="text-xs text-gray-500 mt-1">
            {connection_stats.avg_connections_per_day.toFixed(1)} avg/day
          </p>
        </div>

        <div className="bg-white p-4 small-laptop:p-5 normal-laptop:p-6 rounded-lg shadow-md border-l-4 border-green-500">
          <h3 className="text-gray-600 text-xs small-laptop:text-sm font-medium mb-1 small-laptop:mb-2">Successful Connections</h3>
          <p className="text-2xl small-laptop:text-3xl font-bold text-gray-800">{security_metrics.successful_connections}</p>
          <p className="text-xs text-gray-500 mt-1">
            {connection_stats.connection_success_rate.toFixed(1)}% success rate
          </p>
        </div>

        <div className="bg-white p-4 small-laptop:p-5 normal-laptop:p-6 rounded-lg shadow-md border-l-4 border-red-500">
          <h3 className="text-gray-600 text-xs small-laptop:text-sm font-medium mb-1 small-laptop:mb-2">High Risk Connections</h3>
          <p className="text-2xl small-laptop:text-3xl font-bold text-gray-800">{security_metrics.high_risk_connections}</p>
          <p className="text-xs text-gray-500 mt-1">Requires attention</p>
        </div>

        <div className="bg-white p-4 small-laptop:p-5 normal-laptop:p-6 rounded-lg shadow-md border-l-4 border-purple-500">
          <h3 className="text-gray-600 text-xs small-laptop:text-sm font-medium mb-1 small-laptop:mb-2">Unique Networks</h3>
          <p className="text-2xl small-laptop:text-3xl font-bold text-gray-800">{network_stats.unique_networks_scanned}</p>
          <p className="text-xs text-gray-500 mt-1">Total discovered</p>
        </div>
      </div>

      <div className="grid grid-cols-1 normal-laptop:grid-cols-2 gap-4 small-laptop:gap-5 normal-laptop:gap-6 mb-6 small-laptop:mb-8">
        <div className="bg-white p-4 small-laptop:p-5 normal-laptop:p-6 rounded-lg shadow-md">
          <h2 className="text-lg small-laptop:text-xl font-bold mb-3 small-laptop:mb-4 text-gray-800" data-tour="analytics-risk-chart">Risk Level Distribution</h2>
          <RiskLevelChart securityMetrics={security_metrics} />
        </div>

        <div className="bg-white p-4 small-laptop:p-5 normal-laptop:p-6 rounded-lg shadow-md">
          <h2 className="text-lg small-laptop:text-xl font-bold mb-3 small-laptop:mb-4 text-gray-800" data-tour="analytics-connection-chart">Connection Status</h2>
          <ConnectionStatusChart securityMetrics={security_metrics} />
        </div>
      </div>

      <div className="grid grid-cols-1 normal-laptop:grid-cols-2 gap-4 small-laptop:gap-5 normal-laptop:gap-6 mb-6 small-laptop:mb-8">
        <div className="bg-white p-4 small-laptop:p-5 normal-laptop:p-6 rounded-lg shadow-md">
          <ThreatTypeChart 
            threatAnalytics={data.threat_analytics} 
            threatDateFilter={threatDateFilter}
            onFilterChange={setThreatDateFilter}
          />
        </div>

        <div className="bg-white p-4 small-laptop:p-5 normal-laptop:p-6 rounded-lg shadow-md">
          <h2 className="text-lg small-laptop:text-xl font-bold mb-3 small-laptop:mb-4 text-gray-800" data-tour="analytics-channel-chart">Channel Usage</h2>
          <ChannelUsageChart threatAnalytics={data.threat_analytics} />
        </div>
      </div>

      <div className="grid grid-cols-1 normal-laptop:grid-cols-2 gap-4 small-laptop:gap-5 normal-laptop:gap-6 mb-6 small-laptop:mb-8">
        <div className="bg-white p-4 small-laptop:p-5 normal-laptop:p-6 rounded-lg shadow-md">
          <h2 className="text-lg small-laptop:text-xl font-bold mb-3 small-laptop:mb-4 text-gray-800" data-tour="analytics-list-stats">Blacklist vs Whitelist</h2>
          <BlacklistWhitelistChart blacklistWhitelist={blacklist_whitelist} />
        </div>

        <div className="bg-white p-4 small-laptop:p-5 normal-laptop:p-6 rounded-lg shadow-md">
          <h2 className="text-lg small-laptop:text-xl font-bold mb-3 small-laptop:mb-4 text-gray-800">User Activity Statistics</h2>
          <div className="space-y-3 small-laptop:space-y-4">
            <div className="flex justify-between items-center p-2 small-laptop:p-3 bg-gray-50 rounded">
              <span className="text-sm small-laptop:text-base text-gray-700">Password Changes</span>
              <span className="text-xl small-laptop:text-2xl font-bold text-gray-800">{user_activity.password_changes}</span>
            </div>
            <div className="flex justify-between items-center p-2 small-laptop:p-3 bg-gray-50 rounded">
              <span className="text-sm small-laptop:text-base text-gray-700">Username Changes</span>
              <span className="text-xl small-laptop:text-2xl font-bold text-gray-800">{user_activity.username_changes}</span>
            </div>
            <div className="flex justify-between items-center p-2 small-laptop:p-3 bg-gray-50 rounded">
              <span className="text-sm small-laptop:text-base text-gray-700">Profile Updates</span>
              <span className="text-xl small-laptop:text-2xl font-bold text-gray-800">{user_activity.profile_updates}</span>
            </div>
            <div className="flex justify-between items-center p-2 small-laptop:p-3 bg-gray-50 rounded">
              <span className="text-sm small-laptop:text-base text-gray-700">Profile Save Attempts</span>
              <span className="text-xl small-laptop:text-2xl font-bold text-gray-800">{user_activity.profile_save_attempts}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 small-laptop:grid-cols-2 normal-laptop:grid-cols-3 gap-3 small-laptop:gap-4">
        <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 small-laptop:p-5 normal-laptop:p-6 rounded-lg shadow-md">
          <h3 className="text-base small-laptop:text-lg font-semibold text-red-800 mb-2">Security Metrics</h3>
          <ul className="space-y-2 text-xs small-laptop:text-sm">
            <li className="flex justify-between">
              <span className="text-gray-700">High Risk:</span>
              <span className="font-bold text-red-600">{security_metrics.high_risk_connections}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-gray-700">Medium Risk:</span>
              <span className="font-bold text-yellow-600">{security_metrics.medium_risk_connections}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-gray-700">Low Risk:</span>
              <span className="font-bold text-green-600">{security_metrics.low_risk_connections}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-gray-700">Failed Attempts:</span>
              <span className="font-bold text-red-600">{security_metrics.failed_attempts}</span>
            </li>
          </ul>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 small-laptop:p-5 normal-laptop:p-6 rounded-lg shadow-md">
          <h3 className="text-base small-laptop:text-lg font-semibold text-blue-800 mb-2">Connection Stats</h3>
          <ul className="space-y-2 text-xs small-laptop:text-sm">
            <li className="flex justify-between">
              <span className="text-gray-700">Total Connections:</span>
              <span className="font-bold">{connection_stats.total_connections}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-gray-700">Success Rate:</span>
              <span className="font-bold">{connection_stats.connection_success_rate.toFixed(1)}%</span>
            </li>
            <li className="flex justify-between">
              <span className="text-gray-700">Total Scans:</span>
              <span className="font-bold">{connection_stats.total_scan_attempts}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-gray-700">Avg/Day:</span>
              <span className="font-bold">{connection_stats.avg_connections_per_day.toFixed(1)}</span>
            </li>
          </ul>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 small-laptop:p-5 normal-laptop:p-6 rounded-lg shadow-md">
          <h3 className="text-base small-laptop:text-lg font-semibold text-green-800 mb-2">List Management</h3>
          <ul className="space-y-2 text-xs small-laptop:text-sm">
            <li className="flex justify-between">
              <span className="text-gray-700">Blacklisted:</span>
              <span className="font-bold text-red-600">{blacklist_whitelist.total_blacklisted}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-gray-700">Whitelisted:</span>
              <span className="font-bold text-green-600">{blacklist_whitelist.total_whitelisted}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-gray-700">WL Additions:</span>
              <span className="font-bold">{blacklist_whitelist.whitelist_additions}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-gray-700">WL Removals:</span>
              <span className="font-bold">{blacklist_whitelist.whitelist_removals}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
})

Analytics.displayName = 'Analytics'

export default Analytics
