import React, { FC, useEffect, useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { load } from '@tauri-apps/plugin-store'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { Button, Chip, Table } from 'UI'
import { useGetBlacklistQuery, useGetWhitelistQuery, useAddLogMutation, useGetProfileQuery } from 'store/api'
import { WifiNetworkType } from 'types'
import { RootState } from 'store'
import { getDeviceId } from 'utils/deviceId'
import { saveNetworkCache } from 'utils/cacheManager'
import { TableScanner } from './table-scanner'
import { tableTitle } from './scanner.utils'

const Scanner: FC = () => {
  const navigate = useNavigate()
  const isTempUser = useSelector((state: RootState) => state.user.isTempUser)
  const cachedNetworks = useSelector((state: RootState) => state.user.cachedNetworks)
  const [networks, setNetworks] = useState<WifiNetworkType[]>([])
  const [localWhitelist, setLocalWhitelist] = useState<string[]>([])
  const [localBlacklist, setLocalBlacklist] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [activeNetwork, setActiveNetwork] = useState<WifiNetworkType | null>(null)
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const [isActive, setIsActive] = useState(false)
  
  // Skip API queries for temp users, use cached networks instead
  const { data: blacklist = [] } = useGetBlacklistQuery(undefined, { skip: isTempUser })
  const { data: whitelist = [] } = useGetWhitelistQuery(undefined, { skip: isTempUser })
  const { data: profile } = useGetProfileQuery(undefined, { skip: isTempUser })
  const [addLog] = useAddLogMutation()
  const [activeRiskFilter, setActiveRiskFilter] = useState<string | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  
  // Use cached networks if temp user, otherwise use API data
  const effectiveBlacklist = isTempUser ? cachedNetworks.blacklist : blacklist
  const effectiveWhitelist = isTempUser ? cachedNetworks.whitelist : whitelist


  const RISK_CHIPS = ['Critical', 'High', 'Medium', 'Low', 'Whitelisted']
  const riskKeywordMap: Record<string, string> = {
    critical: 'C',
    high: 'H',
    medium: 'M',
    low: 'L',
    wl: 'WL',
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
      // If user explicitly set to 0, respect it (show all networks regardless of signal)
      if (baseMinSignal === 0) {
        return 0
      }
      // If explicitly set, use it, but adjust based on speed preference
      switch (speedPreference) {
        case 'high':
          return Math.max(baseMinSignal, 70) // Require at least 70% for high speed
        case 'medium':
          return Math.max(baseMinSignal, 50) // Require at least 50% for medium
        case 'low':
          // For low speed preference, respect user's choice if it's low enough
          // Only enforce minimum if user didn't explicitly set a low value
          return Math.max(baseMinSignal, 0) // Allow any signal for low speed
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
        return 0 // Allow all signals for low speed preference when not explicitly set
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
      // Skip logging for guest users
      if (!isTempUser) {
        addLog({ action: "SCAN_START", network_ssid: "-", details: "User started Wi-Fi scan" })
      }
      const result = await invoke<WifiNetworkType[]>('scan_wifi')
      setNetworks(result)
      if (!isTempUser) {
        addLog({ action: "SCAN_SUCCESS", network_ssid: "-", details: `Found ${result.length} networks` })
      }
    } catch (error) {
      const errorMessage = typeof error === 'string' ? error : String(error)
      if (!isTempUser) {
        addLog({ action: "SCAN_FAILED", network_ssid: "-", details: errorMessage })
      }
      console.error('Wi-Fi scan failed', error)
      // Show user-friendly error message
      alert(`Wi-Fi Scan Failed:\n\n${errorMessage}\n\nPlease ensure your WiFi adapter is enabled and try again.`)
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
    const bssidList = effectiveWhitelist.map(wl => wl.bssid.toLowerCase())
    await store.set('whitelist_bssids', bssidList)
    await store.save()
    setLocalWhitelist(bssidList)
  }

  const syncBlacklistToStore = async () => {
    const store = await load('blacklist.json', { autoSave: false })
    const bssidList = effectiveBlacklist.map(bl => bl.bssid.toLowerCase())
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
      if (!isTempUser) {
        addLog({
          action: "DISCONNECTED",
          network_ssid: activeNetwork?.ssid || "-",
          network_bssid: activeNetwork?.bssid,
          details: "User disconnected from Wi-Fi"
        })
      }
      alert('Disconnected from Wi-Fi')
      setActiveNetwork(null)
    } catch (error) {
      if (!isTempUser) {
        addLog({
          action: "DISCONNECT_FAILED",
          network_ssid: activeNetwork?.ssid || "-",
          details: String(error)
        })
      }
      alert('Failed to disconnect')
    }
  }

  const onIsActive = () => setIsActive(!isActive)


  useEffect(() => {
    if (isTempUser) {
      // For temp users, use cached networks directly
      setLocalWhitelist(effectiveWhitelist.map(wl => wl.bssid.toLowerCase()))
      setLocalBlacklist(effectiveBlacklist.map(bl => bl.bssid.toLowerCase()))
    } else {
      loadWhitelistFromStore()
      loadBlacklistFromStore()
    }
    fetchActiveNetwork()
  }, [isTempUser, effectiveWhitelist, effectiveBlacklist])


  useEffect(() => {
    // Only sync if not temp user
    if (!isTempUser) {
      // Always sync whitelist to store, even if empty, to ensure local state is updated
      // This ensures deleted networks are removed from localWhitelist immediately
      syncWhitelistToStore().catch(console.error)
    }
  }, [effectiveWhitelist, isTempUser])

  useEffect(() => {
    // Only sync if not temp user
    if (!isTempUser) {
      // Always sync blacklist to store, even if empty, to ensure local state is updated
      // This ensures deleted networks are removed from localBlacklist immediately
      syncBlacklistToStore().catch(console.error)
    }
  }, [effectiveBlacklist, isTempUser])

  // Cache networks when successfully loaded (for authenticated users)
  useEffect(() => {
    if (!isTempUser && (effectiveWhitelist.length > 0 || effectiveBlacklist.length > 0)) {
      const cacheNetworks = async () => {
        try {
          const deviceId = await getDeviceId()
          console.log('deviceId', deviceId);
          await saveNetworkCache(deviceId, effectiveWhitelist, effectiveBlacklist)
        } catch (error) {
          console.error('Failed to cache networks:', error)
        }
      }
      cacheNetworks()
    }
  }, [isTempUser, effectiveWhitelist, effectiveBlacklist])


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
        // Whitelisted networks always bypass profile filters - they should always be shown
        const isWhitelisted = item.risk === 'WL'
        
        // Apply profile filters if profile exists and network is not whitelisted
        if (profile && !isWhitelisted) {
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
          // If confidence_level is "low", always allow all networks regardless of base max_risk_level
          if (profile.confidence_level === 'low') {
            // Low confidence = allow all risk levels, don't filter by risk
          } else if (itemRiskValue > maxRiskValue) {
            return false
          }

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
          if (profile.profile_type === 'work') {
            // Work profiles: only show secure authentication types
            const secureAuth = ['WPA3', 'WPA2'].some(auth =>
              item.authentication?.toLowerCase().includes(auth.toLowerCase())
            )
            if (!secureAuth) return false
            // Work: no high or critical risk networks
            if (itemRiskValue > 2) return false
          }
        }

        // Apply manual risk filter
        if (chipMappedRisk && item.risk !== chipMappedRisk) {
          // Only show networks that match the selected risk filter
          // WL networks should only show when "Whitelisted" filter is explicitly selected
          return false
        }

        // Apply search term filter
        if (!term) return true

        // Check if search term matches the risk level
        const matchesRisk = mappedRisk ? item.risk === mappedRisk : false
        // Also check if searching for WL networks by searching for "wl", "whitelist", or "whitelisted"
        const matchesWLSearch = !mappedRisk && (term === 'wl' || term === 'whitelist' || term === 'whitelisted') && item.risk === 'WL'
        
        const matchesText =
          item.ssid?.toLowerCase().includes(term) ||
          item.authentication?.toLowerCase().includes(term) ||
          item.encryption?.toLowerCase().includes(term) ||
          item.bssid?.toLowerCase().includes(term)

        return matchesRisk || matchesWLSearch || matchesText
      })
  }


  return (
    <div className="p-3 small-laptop:p-4 normal-laptop:p-5 w-full max-w-full">
      {isTempUser && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
          <p className="text-yellow-800 text-sm">
            <strong>Guest Mode:</strong> You're using cached networks from previous logins. Some features are limited.
          </p>
        </div>
      )}
      <h1 className="font-bold text-lg small-laptop:text-xl normal-laptop:text-[20px] mb-2 small-laptop:mb-[10px]">Wireless Intrusion Prevention System</h1>
      {!!activeNetwork?.ssid &&
        <div className="relative">
          <div onClick={onIsActive}
               className="bg-secondary text-white p-3 small-laptop:p-4 mb-3 small-laptop:mb-4 rounded-t shadow flex flex-col small-laptop:flex-row justify-between items-start small-laptop:items-center gap-2 small-laptop:gap-0 cursor-pointer">
            <div className="flex-1">
              <p className="font-semibold text-sm small-laptop:text-base">Connected to: <span className="text-green-300">{activeNetwork.ssid}</span>
              </p>
            </div>
            <div className="w-full small-laptop:w-[120px]">
              <Button onClick={disconnect} variant="red" >Disconnect</Button>
            </div>
          </div>
          {isActive &&
            <div className="bg-[rgb(70,8,118)] text-white p-4 small-laptop:p-5 rounded-b shadow absolute top-[auto] small-laptop:top-[72px] left-0 right-0 small-laptop:right-auto z-10">
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
      <div className="w-full small-laptop:w-[100px] mb-3 small-laptop:mb-5 mt-3 small-laptop:mt-5">
        <Button variant="secondary" onClick={scanWifi}>
          {isScanning ? 'Scanning...' : 'Scan'}
        </Button>
      </div>
      <div className="mb-3 small-laptop:mb-4">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by SSID, Encryption, Authentication, or Risk"
          className="px-3 small-laptop:px-4 py-2 rounded w-full text-sm small-laptop:text-base border border-gray-300 focus:outline-none focus:ring focus:border-blue-400"
        />
      </div>
      <div className="flex gap-2 mb-3 small-laptop:mb-5 flex-wrap">
        <Button
          onClick={() => setActiveRiskFilter(null)}
          variant={activeRiskFilter === null ? 'secondary' : 'outline'}
          className="!px-3 !py-1 !rounded-full !text-sm !border !gap-0 !p-0 !w-auto !normal-laptop:w-auto !large-laptop:w-auto !wide-screen:w-auto !small-laptop:w-auto"
        >
          All
        </Button>
        {RISK_CHIPS.map(risk => (
          <Button
            key={risk}
            onClick={() => setActiveRiskFilter(risk)}
            variant={activeRiskFilter === risk ? 'secondary' : 'outline'}
            className="!px-3 !py-1 !rounded-full !text-sm !border !gap-0 !p-0 !w-auto !normal-laptop:w-auto !large-laptop:w-auto !wide-screen:w-auto !small-laptop:w-auto"
          >
            {risk}
          </Button>
        ))}
      </div>
      <div className="overflow-x-auto">
        <Table tableTitle={tableTitle} notDataFound={!networks.length} minH='min-h-[300px] small-laptop:min-h-[400px]' maxH='max-h-[400px]'>
          {filterOnActiveNetwork()?.map((row, index) => (
            <TableScanner
              key={index}
              isShowNetwork={openIndex === index}
              onToggle={() => onToggle(index)}
              onFetchActiveNetwork={fetchActiveNetwork}
              data={row}
              isTempUser={isTempUser}
            />
          ))}
        </Table>
      </div>
    </div>
  )
}

export default Scanner
