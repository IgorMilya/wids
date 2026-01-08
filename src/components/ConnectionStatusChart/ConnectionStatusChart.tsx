import React from 'react'
import { Pie } from 'react-chartjs-2'
import { SecurityMetrics } from 'types/analytics.types'

const COLORS = {
  success: '#4ade80',
  danger: '#ef4444',
}

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

interface ConnectionStatusChartProps {
  securityMetrics: SecurityMetrics
}

export const ConnectionStatusChart = React.memo(({ securityMetrics }: ConnectionStatusChartProps) => {
  const connectionStatusData = [
    securityMetrics.successful_connections,
    securityMetrics.failed_attempts,
  ].filter((val) => val > 0)

  const connectionStatusLabels = ['Successful', 'Failed'].filter((_, idx) => [
    securityMetrics.successful_connections,
    securityMetrics.failed_attempts,
  ][idx] > 0)

  const chartData = React.useMemo(() => ({
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
  }), [connectionStatusData, connectionStatusLabels])

  if (connectionStatusData.length === 0) {
    return (
      <div className="flex items-center justify-center h-[250px] small-laptop:h-[300px] text-gray-500">
        No connection data available.
      </div>
    )
  }

  return (
    <div className="h-[250px] small-laptop:h-[300px]">
      <Pie data={chartData} options={pieChartOptions} />
    </div>
  )
})

ConnectionStatusChart.displayName = 'ConnectionStatusChart'

