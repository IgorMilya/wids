import React from 'react'
import { Pie } from 'react-chartjs-2'
import { Button } from 'UI'
import { ThreatAnalytics } from 'store/api'

const COLORS = {
  danger: '#ef4444',
  warning: '#f59e0b',
  primary: '#3e3caa',
  secondary: '#6366f1',
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

interface ThreatTypeChartProps {
  threatAnalytics: ThreatAnalytics
  threatDateFilter: 'day' | 'week' | 'month' | 'year' | 'all'
  onFilterChange: (filter: 'day' | 'week' | 'month' | 'year' | 'all') => void
}

export const ThreatTypeChart = React.memo(({ threatAnalytics, threatDateFilter, onFilterChange }: ThreatTypeChartProps) => {
  const threatTypeData = [
    threatAnalytics.threat_type_distribution.rogue_aps,
    threatAnalytics.threat_type_distribution.evil_twins,
    threatAnalytics.threat_type_distribution.suspicious_open_networks,
    threatAnalytics.threat_type_distribution.weak_encryption,
    threatAnalytics.threat_type_distribution.deauth_attacks,
    threatAnalytics.threat_type_distribution.mac_spoof_attempts,
    threatAnalytics.threat_type_distribution.blacklisted_networks_detected,
  ].filter((val) => val > 0)

  const threatTypeLabels = [
    'Rogue APs',
    'Evil Twins',
    'Suspicious Open Networks',
    'Weak Encryption',
    'Deauth Attacks',
    'MAC Spoof Attempts',
    'Blacklisted Networks Detected',
  ].filter((_, idx) => [
    threatAnalytics.threat_type_distribution.rogue_aps,
    threatAnalytics.threat_type_distribution.evil_twins,
    threatAnalytics.threat_type_distribution.suspicious_open_networks,
    threatAnalytics.threat_type_distribution.weak_encryption,
    threatAnalytics.threat_type_distribution.deauth_attacks,
    threatAnalytics.threat_type_distribution.mac_spoof_attempts,
    threatAnalytics.threat_type_distribution.blacklisted_networks_detected,
  ][idx] > 0)

  const chartData = React.useMemo(() => ({
    labels: threatTypeLabels,
    datasets: [
      {
        label: 'Threat Type Distribution',
        data: threatTypeData,
        backgroundColor: [
          COLORS.danger,
          '#dc2626',
          COLORS.warning,
          '#f59e0b',
          COLORS.primary,
          COLORS.secondary,
          '#7c3aed',
        ].slice(0, threatTypeData.length),
        borderColor: [
          COLORS.danger,
          '#dc2626',
          COLORS.warning,
          '#f59e0b',
          COLORS.primary,
          COLORS.secondary,
          '#7c3aed',
        ].slice(0, threatTypeData.length),
        borderWidth: 2,
      },
    ],
  }), [threatTypeData, threatTypeLabels])

  return (
    <>
      <div className="flex flex-col small-laptop:flex-row justify-between items-start small-laptop:items-center mb-3 small-laptop:mb-4 gap-2">
        <h2 className="text-lg small-laptop:text-xl font-bold text-gray-800" data-tour="analytics-threat-chart">Threat Type Distribution</h2>
        <div className="flex flex-wrap gap-1 small-laptop:gap-2">
          {(['day', 'week', 'month', 'year', 'all'] as const).map((filter) => (
            <Button
              key={filter}
              onClick={() => onFilterChange(filter)}
              variant={threatDateFilter === filter ? 'primary' : 'outline'}
              className={`!px-2 small-laptop:!px-3 !py-1 !rounded !text-xs !font-medium !gap-0 !p-0 !w-auto !normal-laptop:w-auto !large-laptop:w-auto !wide-screen:w-auto !small-laptop:w-auto ${
                threatDateFilter === filter
                  ? '!bg-blue-500 !text-white'
                  : '!bg-gray-100 !text-gray-700 hover:!bg-gray-200'
              }`}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </Button>
          ))}
        </div>
      </div>
      {threatTypeData.length > 0 ? (
        <div className="h-[250px] small-laptop:h-[300px]">
          <Pie data={chartData} options={pieChartOptions} />
        </div>
      ) : (
        <div className="flex items-center justify-center h-[250px] small-laptop:h-[300px] text-gray-500">
          No threat type data available.
        </div>
      )}
    </>
  )
})

ThreatTypeChart.displayName = 'ThreatTypeChart'

