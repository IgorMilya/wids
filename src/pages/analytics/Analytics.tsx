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
import { Pie, Bar, Line } from 'react-chartjs-2'

// Register Chart.js components
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

const COLORS = {
  highRisk: '#ef4444',
  mediumRisk: '#f59e0b',
  lowRisk: '#10b981',
  primary: '#3e3caa',
  secondary: '#6366f1',
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
}

const Analytics = () => {
  const { data, isLoading, isError } = useGetAnalyticsQuery(undefined, {
    // Refetch when window regains focus (user comes back to the tab)
    refetchOnFocus: true,
    // Automatically refetch every 15 seconds while on this page
    pollingInterval: 15000,
  })

  if (isLoading) {
    return (
      <div className="p-5 w-full flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading analytics...</div>
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="p-5 w-full flex items-center justify-center min-h-screen">
        <div className="text-xl text-red-500">Failed to load analytics</div>
      </div>
    )
  }

  const { security_metrics, connection_stats, blacklist_whitelist, user_activity, network_stats, time_series } = data

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  // Risk Level Distribution Pie Chart
  const riskLevelData = [
    security_metrics.high_risk_connections,
    security_metrics.medium_risk_connections,
    security_metrics.low_risk_connections,
  ].filter((val) => val > 0)

  const riskLevelLabels = [
    'High Risk',
    'Medium Risk',
    'Low Risk',
  ].filter((_, idx) => [
    security_metrics.high_risk_connections,
    security_metrics.medium_risk_connections,
    security_metrics.low_risk_connections,
  ][idx] > 0)

  const riskLevelChartData = {
    labels: riskLevelLabels,
    datasets: [
      {
        label: 'Risk Level Distribution',
        data: riskLevelData,
        backgroundColor: [
          COLORS.highRisk,
          COLORS.mediumRisk,
          COLORS.lowRisk,
        ].slice(0, riskLevelData.length),
        borderColor: [
          COLORS.highRisk,
          COLORS.mediumRisk,
          COLORS.lowRisk,
        ].slice(0, riskLevelData.length),
        borderWidth: 2,
      },
    ],
  }

  // Connection Status Pie Chart
  const connectionStatusData = [
    security_metrics.successful_connections,
    security_metrics.failed_attempts,
  ].filter((val) => val > 0)

  const connectionStatusLabels = ['Successful', 'Failed'].filter((_, idx) => [
    security_metrics.successful_connections,
    security_metrics.failed_attempts,
  ][idx] > 0)

  const connectionStatusChartData = {
    labels: connectionStatusLabels,
    datasets: [
      {
        label: 'Connection Status',
        data: connectionStatusData,
        backgroundColor: [COLORS.success, COLORS.danger].slice(0, connectionStatusData.length),
        borderColor: [COLORS.success, COLORS.danger].slice(0, connectionStatusData.length),
        borderWidth: 2,
      },
    ],
  }

  // Daily Activity Line Chart
  const dailyActivityChartData = {
    labels:
      time_series.daily_activity.length > 0
        ? time_series.daily_activity.map((d) => formatDate(d.date))
        : [],
    datasets: [
      {
        label: 'Scans',
        data:
          time_series.daily_activity.length > 0
            ? time_series.daily_activity.map((d) => d.scans)
            : [],
        borderColor: COLORS.primary,
        backgroundColor: `${COLORS.primary}20`,
        fill: true,
        tension: 0.4,
        borderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: 'Connections',
        data:
          time_series.daily_activity.length > 0
            ? time_series.daily_activity.map((d) => d.connections)
            : [],
        borderColor: COLORS.success,
        backgroundColor: `${COLORS.success}20`,
        fill: true,
        tension: 0.4,
        borderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: 'Blacklist Adds',
        data:
          time_series.daily_activity.length > 0
            ? time_series.daily_activity.map((d) => d.blacklist_adds)
            : [],
        borderColor: COLORS.danger,
        backgroundColor: `${COLORS.danger}20`,
        fill: true,
        tension: 0.4,
        borderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: 'Whitelist Adds',
        data:
          time_series.daily_activity.length > 0
            ? time_series.daily_activity.map((d) => d.whitelist_adds)
            : [],
        borderColor: COLORS.warning,
        backgroundColor: `${COLORS.warning}20`,
        fill: true,
        tension: 0.4,
        borderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  }

  // Hourly Activity Bar Chart
  const hourlyActivityChartData = {
    labels:
      time_series.hourly_activity.length > 0
        ? time_series.hourly_activity.map((h) => `${h.hour}:00`)
        : Array.from({ length: 24 }, (_, i) => `${i}:00`),
    datasets: [
      {
        label: 'Activity Count',
        data:
          time_series.hourly_activity.length > 0
            ? time_series.hourly_activity.map((h) => h.activity_count)
            : Array.from({ length: 24 }, () => 0),
        backgroundColor: COLORS.secondary,
        borderColor: COLORS.secondary,
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  }

  // Top Scanned Networks Bar Chart
  const topNetworks = network_stats.most_scanned_networks.slice(0, 5)
  const topNetworksChartData = {
    labels: topNetworks.length > 0 ? topNetworks.map((n) => n.ssid || 'Unknown') : [],
    datasets: [
      {
        label: 'Scan Count',
        data: topNetworks.length > 0 ? topNetworks.map((n) => n.scan_count) : [],
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  }

  // Blacklist vs Whitelist Bar Chart
  const listComparisonChartData = {
    labels: ['Blacklisted', 'Whitelisted'],
    datasets: [
      {
        label: 'Total Networks',
        data: [blacklist_whitelist.total_blacklisted, blacklist_whitelist.total_whitelisted],
        backgroundColor: [COLORS.danger, COLORS.success],
        borderColor: [COLORS.danger, COLORS.success],
        borderWidth: 2,
        borderRadius: 4,
      },
    ],
  }

  // Chart options
  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 15,
          font: {
            size: 12,
            weight: 'bold' as const,
          },
          usePointStyle: true,
        },
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            const label = context.label || ''
            const value = context.parsed || 0
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0)
            const percentage = ((value / total) * 100).toFixed(1)
            return `${label}: ${value} (${percentage}%)`
          },
        },
        padding: 12,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleFont: {
          size: 14,
          weight: 'bold' as const,
        },
        bodyFont: {
          size: 12,
        },
      },
    },
  }

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          padding: 15,
          font: {
            size: 12,
            weight: 'bold' as const,
          },
          usePointStyle: true,
        },
      },
      tooltip: {
        padding: 12,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleFont: {
          size: 14,
          weight: 'bold' as const,
        },
        bodyFont: {
          size: 12,
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          font: {
            size: 11,
          },
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          font: {
            size: 11,
          },
        },
      },
    },
  }

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        padding: 12,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleFont: {
          size: 14,
          weight: 'bold' as const,
        },
        bodyFont: {
          size: 12,
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          font: {
            size: 11,
          },
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          font: {
            size: 11,
          },
        },
      },
    },
  }

  const horizontalBarChartOptions = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        padding: 12,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleFont: {
          size: 14,
          weight: 'bold' as const,
        },
        bodyFont: {
          size: 12,
        },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          font: {
            size: 11,
          },
        },
      },
      y: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 11,
          },
        },
      },
    },
  }

  return (
    <div className="p-5 w-full max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Analytics Dashboard</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
          <h3 className="text-gray-600 text-sm font-medium mb-2">Total Scans</h3>
          <p className="text-3xl font-bold text-gray-800">{connection_stats.total_scan_attempts}</p>
          <p className="text-xs text-gray-500 mt-1">
            {connection_stats.avg_connections_per_day.toFixed(1)} avg/day
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
          <h3 className="text-gray-600 text-sm font-medium mb-2">Successful Connections</h3>
          <p className="text-3xl font-bold text-gray-800">{security_metrics.successful_connections}</p>
          <p className="text-xs text-gray-500 mt-1">
            {connection_stats.connection_success_rate.toFixed(1)}% success rate
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-red-500">
          <h3 className="text-gray-600 text-sm font-medium mb-2">High Risk Connections</h3>
          <p className="text-3xl font-bold text-gray-800">{security_metrics.high_risk_connections}</p>
          <p className="text-xs text-gray-500 mt-1">Requires attention</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-500">
          <h3 className="text-gray-600 text-sm font-medium mb-2">Unique Networks</h3>
          <p className="text-3xl font-bold text-gray-800">{network_stats.unique_networks_scanned}</p>
          <p className="text-xs text-gray-500 mt-1">Total discovered</p>
        </div>
      </div>

      {/* Security Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4 text-gray-800">Risk Level Distribution</h2>
          {riskLevelData.length > 0 ? (
            <div className="h-[300px]">
              <Pie data={riskLevelChartData} options={pieChartOptions} />
            </div>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-500">
              No risk data available.
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4 text-gray-800">Connection Status</h2>
          {connectionStatusData.length > 0 ? (
            <div className="h-[300px]">
              <Pie data={connectionStatusChartData} options={pieChartOptions} />
            </div>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-500">
              No connection data available.
            </div>
          )}
        </div>
      </div>

      {/* Daily Activity Chart */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Daily Activity (Last 30 Days)</h2>
        {time_series.daily_activity.length > 0 ? (
          <div className="h-[350px]">
            <Line data={dailyActivityChartData} options={lineChartOptions} />
          </div>
        ) : (
          <div className="flex items-center justify-center h-[350px] text-gray-500">
            No daily activity data available for the last 30 days.
          </div>
        )}
      </div>

      {/* Hourly Activity & Top Networks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4 text-gray-800">Hourly Activity (Last 7 Days)</h2>
          {time_series.hourly_activity.length > 0 ? (
            <div className="h-[300px]">
              <Bar data={hourlyActivityChartData} options={barChartOptions} />
            </div>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-500">
              No hourly activity data available for the last 7 days.
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4 text-gray-800">Top Scanned Networks</h2>
          {topNetworks.length > 0 ? (
            <div className="h-[300px]">
              <Bar data={topNetworksChartData} options={horizontalBarChartOptions} />
            </div>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-500">
              No network scan data available
            </div>
          )}
        </div>
      </div>

      {/* Blacklist/Whitelist Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4 text-gray-800">Blacklist vs Whitelist</h2>
          <div className="h-[250px] mb-4">
            <Bar data={listComparisonChartData} options={barChartOptions} />
          </div>
          <div className="mt-4 space-y-4">
            {/* Time-based filters */}
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="text-center p-2 bg-gray-50 rounded">
                <p className="font-semibold text-gray-700">Today</p>
              </div>
              <div className="text-center p-2 bg-gray-50 rounded">
                <p className="font-semibold text-gray-700">This Week</p>
              </div>
              <div className="text-center p-2 bg-gray-50 rounded">
                <p className="font-semibold text-gray-700">This Month</p>
              </div>
            </div>
            {/* Blacklist Stats */}
            <div className="border-t pt-3">
              <p className="text-sm font-semibold text-red-700 mb-2">Blacklist</p>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="text-center">
                  <p className="text-lg font-bold text-red-600">
                    +{blacklist_whitelist.blacklist_additions_today} / -{blacklist_whitelist.blacklist_removals_today}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-red-600">
                    +{blacklist_whitelist.blacklist_additions_week} / -{blacklist_whitelist.blacklist_removals_week}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-red-600">
                    +{blacklist_whitelist.blacklist_additions_month} / -{blacklist_whitelist.blacklist_removals_month}
                  </p>
                </div>
              </div>
            </div>
            {/* Whitelist Stats */}
            <div className="border-t pt-3">
              <p className="text-sm font-semibold text-green-700 mb-2">Whitelist</p>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="text-center">
                  <p className="text-lg font-bold text-green-600">
                    +{blacklist_whitelist.whitelist_additions_today} / -{blacklist_whitelist.whitelist_removals_today}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-green-600">
                    +{blacklist_whitelist.whitelist_additions_week} / -{blacklist_whitelist.whitelist_removals_week}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-green-600">
                    +{blacklist_whitelist.whitelist_additions_month} / -{blacklist_whitelist.whitelist_removals_month}
                  </p>
                </div>
              </div>
            </div>
            {/* Total Stats */}
            <div className="border-t pt-3 grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{blacklist_whitelist.blacklist_additions}</p>
                <p className="text-sm text-gray-600">Total Blacklist Additions</p>
                <p className="text-2xl font-bold text-red-600">{blacklist_whitelist.blacklist_removals}</p>
                <p className="text-sm text-gray-600">Total Blacklist Removals</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{blacklist_whitelist.whitelist_additions}</p>
                <p className="text-sm text-gray-600">Total Whitelist Additions</p>
                <p className="text-2xl font-bold text-green-600">{blacklist_whitelist.whitelist_removals}</p>
                <p className="text-sm text-gray-600">Total Whitelist Removals</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4 text-gray-800">User Activity Statistics</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span className="text-gray-700">Password Changes</span>
              <span className="text-2xl font-bold text-gray-800">{user_activity.password_changes}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span className="text-gray-700">Username Changes</span>
              <span className="text-2xl font-bold text-gray-800">{user_activity.username_changes}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span className="text-gray-700">Profile Updates</span>
              <span className="text-2xl font-bold text-gray-800">{user_activity.profile_updates}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span className="text-gray-700">Profile Save Attempts</span>
              <span className="text-2xl font-bold text-gray-800">{user_activity.profile_save_attempts}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-red-800 mb-2">Security Metrics</h3>
          <ul className="space-y-2 text-sm">
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

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">Connection Stats</h3>
          <ul className="space-y-2 text-sm">
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

        <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-green-800 mb-2">List Management</h3>
          <ul className="space-y-2 text-sm">
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
}

export default Analytics
