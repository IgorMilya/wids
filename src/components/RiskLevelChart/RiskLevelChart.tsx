import React from 'react'
import { Pie } from 'react-chartjs-2'
import { SecurityMetrics } from 'types/analytics.types'

const COLORS = {
  highRisk: '#ef4444',
  mediumRisk: '#f59e0b',
  lowRisk: '#4ade80',
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

interface RiskLevelChartProps {
  securityMetrics: SecurityMetrics
}

export const RiskLevelChart = React.memo(({ securityMetrics }: RiskLevelChartProps) => {
  const riskLevelEntries = [
    { label: 'High Risk', value: securityMetrics.high_risk_connections, color: COLORS.highRisk },
    { label: 'Medium Risk', value: securityMetrics.medium_risk_connections, color: COLORS.mediumRisk },
    { label: 'Low Risk', value: securityMetrics.low_risk_connections, color: COLORS.lowRisk },
  ].filter((entry) => entry.value > 0)

  const riskLevelData = riskLevelEntries.map((entry) => entry.value)
  const riskLevelLabels = riskLevelEntries.map((entry) => entry.label)
  const riskLevelColors = riskLevelEntries.map((entry) => entry.color)

  const chartData = React.useMemo(() => ({
    labels: riskLevelLabels,
    datasets: [
      {
        label: 'Risk Level Distribution',
        data: riskLevelData,
        backgroundColor: riskLevelColors,
        borderColor: riskLevelColors,
        borderWidth: 2,
      },
    ],
  }), [riskLevelData, riskLevelLabels, riskLevelColors])

  if (riskLevelData.length === 0) {
    return (
      <div className="flex items-center justify-center h-[250px] small-laptop:h-[300px] text-gray-500">
        No risk data available.
      </div>
    )
  }

  return (
    <div className="h-[250px] small-laptop:h-[300px]">
      <Pie data={chartData} options={pieChartOptions} />
    </div>
  )
})

RiskLevelChart.displayName = 'RiskLevelChart'

