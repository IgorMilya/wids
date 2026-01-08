import React from 'react'
import { Bar } from 'react-chartjs-2'
import { ThreatAnalytics } from 'types/analytics.types'

const COLORS = {
  primary: '#3e3caa',
  secondary: '#6366f1',
  warning: '#f59e0b',
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

interface ChannelUsageChartProps {
  threatAnalytics: ThreatAnalytics
}

export const ChannelUsageChart = React.memo(({ threatAnalytics }: ChannelUsageChartProps) => {
  const channelLabels = React.useMemo(() => [
    'Channel 1',
    'Channel 6',
    'Channel 11',
    ...threatAnalytics.channel_usage.channels_5ghz.map(c => `Ch ${c.channel}`)
  ], [threatAnalytics.channel_usage.channels_5ghz])

  const channelData = React.useMemo(() => [
    threatAnalytics.channel_usage.channel_1,
    threatAnalytics.channel_usage.channel_6,
    threatAnalytics.channel_usage.channel_11,
    ...threatAnalytics.channel_usage.channels_5ghz.map(c => c.count),
  ], [threatAnalytics.channel_usage])

  const chartData = React.useMemo(() => ({
    labels: channelLabels,
    datasets: [
      {
        label: 'AP Count',
        data: channelData,
        backgroundColor: [
          COLORS.primary,
          COLORS.secondary,
          COLORS.warning,
          ...threatAnalytics.channel_usage.channels_5ghz.map(() => '#8b5cf6'),
        ],
        borderColor: [
          COLORS.primary,
          COLORS.secondary,
          COLORS.warning,
          ...threatAnalytics.channel_usage.channels_5ghz.map(() => '#8b5cf6'),
        ],
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  }), [channelLabels, channelData, threatAnalytics.channel_usage.channels_5ghz])

  if (!channelData.some(v => v > 0)) {
    return (
      <div className="flex items-center justify-center h-[250px] small-laptop:h-[300px] text-gray-500">
        No channel usage data available.
      </div>
    )
  }

  return (
    <div className="h-[250px] small-laptop:h-[300px]">
      <Bar data={chartData} options={barChartOptions} />
    </div>
  )
})

ChannelUsageChart.displayName = 'ChannelUsageChart'

