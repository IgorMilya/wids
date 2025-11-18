import React, { FC, useEffect, useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { load } from '@tauri-apps/plugin-store'
import { Button, Chip, Table } from 'UI'
import { useGetBlacklistQuery, useGetWhitelistQuery, useAddLogMutation, useGetProfileQuery } from 'store/api'
import { WifiNetworkType } from 'types'
import { TableScanner } from './table-scanner'
import { tableTitle } from './scanner.utils'

const Scanner: FC = () => {
  const [networks, setNetworks] = useState<WifiNetworkType[]>([])
  const [localWhitelist, setLocalWhitelist] = useState<string[]>([])
  const [localBlacklist, setLocalBlacklist] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [activeNetwork, setActiveNetwork] = useState<WifiNetworkType | null>(null)
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const [isActive, setIsActive] = useState(false)
  const { data: blacklist = [] } = useGetBlacklistQuery()
  const { data: whitelist = [] } = useGetWhitelistQuery()
  const { data: profile } = useGetProfileQuery()
  const [addLog] = useAddLogMutation()
  const [activeRiskFilter, setActiveRiskFilter] = useState<string | null>(null)
  const [isScanning, setIsScanning] = useState(false)


  const RISK_CHIPS = ['Critical', 'High', 'Medium', 'Low', 'Whitelisted']
  const riskKeywordMap: Record<string, string> = {
    critical: 'C',
    high: 'H',
    medium: 'M',
    low: 'L',
    whitelist: 'WL',
    whitelisted: 'WL',
  }

  const riskLevelValue: Record<string, number> = {
    'L': 1,
    'M': 2,
    'H': 3,
    'C': 4,
    'WL': 0,
  }

  // Helper function to calculate effective minimum signal strength based on speed_network_preference
  const getEffectiveMinSignal = (baseMinSignal: number | null | undefined, speedPreference: string | undefined): number => {
    if (baseMinSignal !== null && baseMinSignal !== undefined) {
      // If explicitly set, use it, but adjust based on speed preference
      switch (speedPreference) {
        case 'high':
          return Math.max(baseMinSignal, 70) // Require at least 70% for high speed
        case 'medium':
          return Math.max(baseMinSignal, 50) // Require at least 50% for medium
        case 'low':
          return Math.max(baseMinSignal, 30) // Allow lower signal for low speed
        default:
          return baseMinSignal || 50
      }
    }
    // Default based on speed preference
    switch (speedPreference) {
      case 'high':
        return 70
      case 'medium':
        return 50
      case 'low':
        return 30
      default:
        return 50
    }
  }

  // Helper function to calculate effective maximum risk level based on confidence_level
  const getEffectiveMaxRisk = (baseMaxRisk: string | null | undefined, confidenceLevel: string | undefined, profileType: string | undefined): string => {
    const baseRiskValue = baseMaxRisk ? riskLevelValue[baseMaxRisk] || 4 : 4
    
    // Adjust based on confidence level
    let adjustedRisk = baseRiskValue
    switch (confidenceLevel) {
      case 'high':
        // High confidence = stricter (lower max risk)
        adjustedRisk = Math.min(baseRiskValue, 2) // Only Low or Medium
        break
      case 'medium':
        adjustedRisk = Math.min(baseRiskValue, 3) // Up to High
        break
      case 'low':
        // Low confidence = more lenient (allow higher risk)
        adjustedRisk = 4 // Allow all
        break
    }

    // Adjust based on profile type (work requires more security)
    if (profileType === 'work') {
      adjustedRisk = Math.min(adjustedRisk, 2) // Work networks should be Low or Medium only
    } else if (profileType === 'public') {
      adjustedRisk = Math.min(adjustedRisk, 2) // Public networks should be more secure
    }
    // personal: use adjusted risk as calculated

    // Convert back to risk level string
    if (adjustedRisk <= 1) return 'L'
    if (adjustedRisk <= 2) return 'M'
    if (adjustedRisk <= 3) return 'H'
    return 'C'
  }

  const scanWifi = async () => {
    try {
      setIsScanning(true)
      addLog({ action: "SCAN_START", network_ssid: "-", details: "User started Wi-Fi scan" })
      const result = await invoke<WifiNetworkType[]>('scan_wifi')
      setNetworks(result)
      addLog({ action: "SCAN_SUCCESS", network_ssid: "-", details: `Found ${result.length} networks` })
    } catch (error) {
      addLog({ action: "SCAN_FAILED", network_ssid: "-", details: String(error) })
      console.error('Wi-Fi scan failed', error)
    } finally {
      setIsScanning(false)
    }
  }


  const onToggle = (index: number) => setOpenIndex(openIndex === index ? null : index)

  const fetchActiveNetwork = async () => {
    try {
      const result = await invoke<WifiNetworkType[] | null>('get_active_network')
      let network = result?.[0] ?? null

      if (network && localWhitelist.includes(network.bssid.toLowerCase())) {
        network = { ...network, risk: 'WL' }
      }

      setActiveNetwork(network)
    } catch (error) {
      console.error('Failed to get active network', error)
    }
  }

  const syncWhitelistToStore = async () => {
    const store = await load('whitelist.json', { autoSave: false })
    const bssidList = whitelist.map(wl => wl.bssid.toLowerCase())
    await store.set('whitelist_bssids', bssidList)
    await store.save()
    setLocalWhitelist(bssidList)
  }

  const syncBlacklistToStore = async () => {
    const store = await load('blacklist.json', { autoSave: false })
    const bssidList = blacklist.map(bl => bl.bssid.toLowerCase())
    await store.set('blacklist_bssids', bssidList)
    await store.save()
    setLocalBlacklist(bssidList)
  }


  const loadWhitelistFromStore = async () => {
    const store = await load('whitelist.json', { autoSave: false })
    const val = await store.get<string[]>('whitelist_bssids') || []
    setLocalWhitelist(val.map(v => v.toLowerCase()))
  }

  const loadBlacklistFromStore = async () => {
    const store = await load('blacklist.json', { autoSave: false })
    const val = await store.get<string[]>('blacklist_bssids') || []
    setLocalBlacklist(val.map(v => v.toLowerCase()))
  }

  const disconnect = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await invoke('disconnect_wifi')
      addLog({
        action: "DISCONNECTED",
        network_ssid: activeNetwork?.ssid || "-",
        network_bssid: activeNetwork?.bssid,
        details: "User disconnected from Wi-Fi"
      })
      alert('Disconnected from Wi-Fi')
      setActiveNetwork(null)
    } catch (error) {
      addLog({
        action: "DISCONNECT_FAILED",
        network_ssid: activeNetwork?.ssid || "-",
        details: String(error)
      })
      alert('Failed to disconnect')
    }
  }

  const onIsActive = () => setIsActive(!isActive)

  useEffect(() => {
    loadWhitelistFromStore()
    loadBlacklistFromStore()
    fetchActiveNetwork()
  }, [])


  useEffect(() => {
    if (whitelist.length > 0) {
      syncWhitelistToStore()
    }
  }, [whitelist])

  useEffect(() => {
    if (blacklist.length > 0) {
      syncBlacklistToStore()
    }
  }, [blacklist])


  const filterOnActiveNetwork = () => {
    const term = searchTerm.toLowerCase()
    const mappedRisk = riskKeywordMap[term] ?? null
    const chipMappedRisk = activeRiskFilter ? riskKeywordMap[activeRiskFilter.toLowerCase()] : null

    return networks
      .filter(item =>
        item.bssid !== activeNetwork?.bssid &&
        !localBlacklist.includes(item.bssid.toLowerCase()),
      )
      .map(item => ({
        ...item,
        risk: localWhitelist.includes(item.bssid.toLowerCase()) ? 'WL' : item.risk,
      }))
      .filter(item => {
        // Apply profile filters if profile exists
        if (profile) {
          // Calculate effective values based on preferences
          const effectiveMinSignal = getEffectiveMinSignal(
            profile.min_signal_strength,
            profile.speed_network_preference
          )
          const effectiveMaxRisk = getEffectiveMaxRisk(
            profile.max_risk_level,
            profile.confidence_level,
            profile.profile_type
          )

          // Apply profiling_preference strategy
          // If profiling_preference is "speed", prioritize signal strength over security
          // If profiling_preference is "security", prioritize security over speed
          // If profiling_preference is "balanced", use balanced approach
          const isSpeedPriority = profile.profiling_preference === 'speed'
          const isSecurityPriority = profile.profiling_preference === 'security'

          // Filter by preferred authentication types
          if (profile.preferred_authentication && profile.preferred_authentication.length > 0) {
            const hasPreferredAuth = profile.preferred_authentication.some(auth =>
              item.authentication?.toLowerCase().includes(auth.toLowerCase())
            )
            if (!hasPreferredAuth) return false
          }

          // Filter by effective minimum signal strength
          const signalStrength = parseInt(item.signal?.replace('%', '') || '0')
          if (signalStrength < effectiveMinSignal) return false

          // Filter by effective maximum risk level
          const itemRiskValue = riskLevelValue[item.risk] || 4
          const maxRiskValue = riskLevelValue[effectiveMaxRisk] || 4
          if (itemRiskValue > maxRiskValue) return false

          // Apply network preference filtering
          if (profile.network_preference === 'more_speed_less_security') {
            // More speed, less security: allow higher risk if signal is strong
            // Already handled by effective values, but can be more lenient
            if (signalStrength > 80 && itemRiskValue <= 4) {
              // Allow any risk if signal is very strong
            } else if (itemRiskValue > maxRiskValue) {
              return false
            }
          } else if (profile.network_preference === 'more_security_less_speed') {
            // More security, less speed: stricter risk filtering
            // Enforce stricter risk even if signal is lower
            if (itemRiskValue > 2) return false // Only Low and Medium risk
          }
          // balanced: use effective values as calculated

          // Additional filtering based on profiling_preference priority
          if (isSecurityPriority && itemRiskValue > 2) {
            // Security priority: only show Low and Medium risk
            return false
          }

          if (isSpeedPriority && signalStrength < effectiveMinSignal * 0.8) {
            // Speed priority: can accept slightly lower signal, but not too low
            if (signalStrength < effectiveMinSignal * 0.6) return false
          }

          // Profile type specific filtering
          if (profile.profile_type === 'work' || profile.profile_type === 'public') {
            // Work and public profiles: only show secure authentication types
            const secureAuth = ['WPA3', 'WPA2'].some(auth =>
              item.authentication?.toLowerCase().includes(auth.toLowerCase())
            )
            if (!secureAuth) return false
            // Work and public: no high or critical risk networks
            if (itemRiskValue > 2) return false
          }
        }

        // Apply manual risk filter
        if (chipMappedRisk && item.risk !== chipMappedRisk) return false

        // Apply search term filter
        if (!term) return true

        const matchesRisk = mappedRisk ? item.risk?.toLowerCase() === mappedRisk.toLowerCase() : false
        const matchesText =
          item.ssid?.toLowerCase().includes(term) ||
          item.authentication?.toLowerCase().includes(term) ||
          item.encryption?.toLowerCase().includes(term) ||
          item.bssid?.toLowerCase().includes(term)

        return matchesRisk || matchesText
      })
  }


  return (
    <div className="p-5 w-full">
      <h1 className="font-bold text-[20px] mb-[10px]">Wireless Intrusion Prevention System</h1>
      {!!activeNetwork?.ssid &&
        <div className="relative">
          <div onClick={onIsActive}
               className="bg-secondary text-white p-4 mb-4 rounded-t shadow flex justify-between items-center cursor-pointer">
            <div>
              <p className="font-semibold">Connected to: <span className="text-green-300">{activeNetwork.ssid}</span>
              </p>
            </div>
            <div className="w-[120px]">
              <Button onClick={disconnect} variant="red">Disconnect</Button>
            </div>
          </div>
          {isActive &&
            <div className="bg-[rgb(70,8,118)] text-white p-5 rounded-b shadow absolute top-[72px] left-0 z-10">
              <p className="font-bold">BSSID: <span className="font-normal">{activeNetwork.bssid}</span></p>
              <p className="font-bold">Signal: <span className="font-normal">{activeNetwork.signal}</span></p>
              <p className="font-bold">Risk: <Chip risk={activeNetwork.risk} /></p>
              <p className="font-bold">Authentication: <span
                className="font-normal">{activeNetwork.authentication}</span>
              </p>
              <p className="font-bold">Encryption: <span className="font-normal">{activeNetwork.encryption}</span></p>
            </div>}
        </div>
      }
      <div className="w-[100px] mb-5 mt-5">
        <Button variant="secondary" onClick={scanWifi}>
          {isScanning ? 'Scanning...' : 'Scan'}
        </Button>
      </div>
      <div className="mb-4">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by SSID, Encryption, Authentication, or Risk"
          className="px-4 py-2 rounded w-full border border-gray-300 focus:outline-none focus:ring focus:border-blue-400"
        />
      </div>
      <div className="flex gap-2 mb-5 flex-wrap">
        <button
          onClick={() => setActiveRiskFilter(null)}
          className={`px-3 py-1 rounded-full text-sm border ${
            activeRiskFilter === null ? 'bg-secondary text-white' : 'bg-white text-gray-800'
          }`}
        >
          All
        </button>
        {RISK_CHIPS.map(risk => (
          <button
            key={risk}
            onClick={() => setActiveRiskFilter(risk)}
            className={`px-3 py-1 rounded-full text-sm border ${
              activeRiskFilter === risk ? 'bg-secondary text-white' : 'bg-white text-gray-800'
            }`}
          >
            {risk}
          </button>
        ))}
      </div>
      <div>
        <Table tableTitle={tableTitle} notDataFound={!networks.length} minH='min-h-[400px]' maxH='max-h-[400px]'>
          {filterOnActiveNetwork()?.map((row, index) => (
            <TableScanner
              key={index}
              isShowNetwork={openIndex === index}
              onToggle={() => onToggle(index)}
              onFetchActiveNetwork={fetchActiveNetwork}
              data={row}
            />
          ))}
        </Table>
      </div>
    </div>
  )
}

export default Scanner
