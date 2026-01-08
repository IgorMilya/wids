import React from 'react'
import { Bar } from 'react-chartjs-2'
import { BlacklistWhitelistStats } from 'types/analytics.types'

const COLORS = {
  danger: '#ef4444',
  success: '#22c55e',
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

interface BlacklistWhitelistChartProps {
  blacklistWhitelist: BlacklistWhitelistStats
}

export const BlacklistWhitelistChart = React.memo(({ blacklistWhitelist }: BlacklistWhitelistChartProps) => {
  const chartData = React.useMemo(() => ({
    labels: ['Blacklisted', 'Whitelisted'],
    datasets: [
      {
        label: 'Total Networks',
        data: [blacklistWhitelist.total_blacklisted, blacklistWhitelist.total_whitelisted],
        backgroundColor: [COLORS.danger, COLORS.success],
        borderColor: [COLORS.danger, COLORS.success],
        borderWidth: 2,
        borderRadius: 4,
      },
    ],
  }), [blacklistWhitelist.total_blacklisted, blacklistWhitelist.total_whitelisted])

  return (
    <>
      <div className="h-[200px] small-laptop:h-[250px] mb-3 small-laptop:mb-4">
        <Bar data={chartData} options={barChartOptions} />
      </div>
      <div className="mt-4 space-y-4">
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
        <div className="border-t pt-3">
          <p className="text-sm font-semibold text-red-700 mb-2">Blacklist</p>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="text-center">
              <p className="text-lg font-bold text-red-600">
                +{blacklistWhitelist.blacklist_additions_today} / -{blacklistWhitelist.blacklist_removals_today}
              </p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-red-600">
                +{blacklistWhitelist.blacklist_additions_week} / -{blacklistWhitelist.blacklist_removals_week}
              </p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-red-600">
                +{blacklistWhitelist.blacklist_additions_month} / -{blacklistWhitelist.blacklist_removals_month}
              </p>
            </div>
          </div>
        </div>
        <div className="border-t pt-3">
          <p className="text-sm font-semibold text-green-700 mb-2">Whitelist</p>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="text-center">
              <p className="text-lg font-bold text-green-600">
                +{blacklistWhitelist.whitelist_additions_today} / -{blacklistWhitelist.whitelist_removals_today}
              </p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-green-600">
                +{blacklistWhitelist.whitelist_additions_week} / -{blacklistWhitelist.whitelist_removals_week}
              </p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-green-600">
                +{blacklistWhitelist.whitelist_additions_month} / -{blacklistWhitelist.whitelist_removals_month}
              </p>
            </div>
          </div>
        </div>
        <div className="border-t pt-3 grid grid-cols-1 small-laptop:grid-cols-2 gap-3 small-laptop:gap-4">
          <div className="text-center">
            <p className="text-xl small-laptop:text-2xl font-bold text-red-600">{blacklistWhitelist.blacklist_additions}</p>
            <p className="text-xs small-laptop:text-sm text-gray-600">Total Blacklist Additions</p>
            <p className="text-xl small-laptop:text-2xl font-bold text-red-600 mt-2">{blacklistWhitelist.blacklist_removals}</p>
            <p className="text-xs small-laptop:text-sm text-gray-600">Total Blacklist Removals</p>
          </div>
          <div className="text-center">
            <p className="text-xl small-laptop:text-2xl font-bold text-green-600">{blacklistWhitelist.whitelist_additions}</p>
            <p className="text-xs small-laptop:text-sm text-gray-600">Total Whitelist Additions</p>
            <p className="text-xl small-laptop:text-2xl font-bold text-green-600 mt-2">{blacklistWhitelist.whitelist_removals}</p>
            <p className="text-xs small-laptop:text-sm text-gray-600">Total Whitelist Removals</p>
          </div>
        </div>
      </div>
    </>
  )
})

BlacklistWhitelistChart.displayName = 'BlacklistWhitelistChart'

