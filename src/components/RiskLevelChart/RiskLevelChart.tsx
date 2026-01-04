import React from 'react'
import { Pie } from 'react-chartjs-2'
import { SecurityMetrics } from 'store/api'

const COLORS = {
  highRisk: '#ef4444',
  mediumRisk: '#f59e0b',
  lowRisk: '#10b981',
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
  const riskLevelData = [
    securityMetrics.high_risk_connections,
    securityMetrics.medium_risk_connections,
    securityMetrics.low_risk_connections,
  ].filter((val) => val > 0)

  const riskLevelLabels = [
    'High Risk',
    'Medium Risk',
    'Low Risk',
  ].filter((_, idx) => [
    securityMetrics.high_risk_connections,
    securityMetrics.medium_risk_connections,
    securityMetrics.low_risk_connections,
  ][idx] > 0)

  const chartData = React.useMemo(() => ({
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
  }), [riskLevelData, riskLevelLabels])

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

