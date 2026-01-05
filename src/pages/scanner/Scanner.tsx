import React, { FC, useEffect, useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { load } from '@tauri-apps/plugin-store'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { Button, Chip, Table } from 'UI'
import { useGetBlacklistQuery, useGetWhitelistQuery, useAddLogMutation, useGetProfileQuery } from 'store/api'
import { WifiNetworkType } from 'types'
import { RootState } from 'store'
import { getDeviceId, saveNetworkCache } from 'utils'
import { TableScanner } from './table-scanner'
import { tableTitle } from './scanner.utils'

// TODO:
const Scanner: FC = () => {
  const isTempUser = useSelector((state: RootState) => state.user.isTempUser)
  const cachedNetworks = useSelector((state: RootState) => state.user.cachedNetworks)
  const [networks, setNetworks] = useState<WifiNetworkType[]>([])
  const [localWhitelist, setLocalWhitelist] = useState<string[]>([])
  const [localBlacklist, setLocalBlacklist] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [activeNetwork, setActiveNetwork] = useState<WifiNetworkType | null>(null)
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const [isActive, setIsActive] = useState(false)
  
  const { data: blacklist = [] } = useGetBlacklistQuery(undefined, { skip: isTempUser })
  const { data: whitelist = [] } = useGetWhitelistQuery(undefined, { skip: isTempUser })
  const { data: profile } = useGetProfileQuery(undefined, { skip: isTempUser })
  const [addLog] = useAddLogMutation()
  const [activeRiskFilter, setActiveRiskFilter] = useState<string | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null)
  
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

  const getEffectiveMinSignal = (baseMinSignal: number | null | undefined, speedPreference: string | undefined): number => {
    if (baseMinSignal !== null && baseMinSignal !== undefined) {
      if (baseMinSignal === 0) {
        return 0
      }
      switch (speedPreference) {
        case 'high':
          return Math.max(baseMinSignal, 70)
        case 'medium':
          return Math.max(baseMinSignal, 50) 
        case 'low':
          return Math.max(baseMinSignal, 0) 
        default:
          return baseMinSignal || 50
      }
    }
    switch (speedPreference) {
      case 'high':
        return 70
      case 'medium':
        return 50
      case 'low':
        return 0 
      default:
        return 50
    }
  }

  const getEffectiveMaxRisk = (baseMaxRisk: string | null | undefined, confidenceLevel: string | undefined, profileType: string | undefined): string => {
    const baseRiskValue = baseMaxRisk ? riskLevelValue[baseMaxRisk] || 4 : 4
    
    let adjustedRisk = baseRiskValue
    switch (confidenceLevel) {
      case 'high':
        adjustedRisk = Math.min(baseRiskValue, 2) 
        break
      case 'medium':
        adjustedRisk = Math.min(baseRiskValue, 3) 
        break
      case 'low':
        adjustedRisk = 4 
        break
    }

    if (profileType === 'work') {
      adjustedRisk = Math.min(adjustedRisk, 2) 
    }

    if (adjustedRisk <= 1) return 'L'
    if (adjustedRisk <= 2) return 'M'
    if (adjustedRisk <= 3) return 'H'
    return 'C'
  }

  const scanWifi = async () => {
    try {
      setIsScanning(true)
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
    fetchActiveNetwork()
  }, [])

  useEffect(() => {
    if (isTempUser) {
      setLocalWhitelist(effectiveWhitelist.map(wl => wl.bssid.toLowerCase()))
      setLocalBlacklist(effectiveBlacklist.map(bl => bl.bssid.toLowerCase()))
    } else {
      loadWhitelistFromStore()
      loadBlacklistFromStore()
    }
  }, [isTempUser, effectiveWhitelist, effectiveBlacklist])


  useEffect(() => {
    if (!isTempUser) {
      syncWhitelistToStore().catch(console.error)
    }
  }, [effectiveWhitelist, isTempUser])

  useEffect(() => {
    if (!isTempUser) {
      syncBlacklistToStore().catch(console.error)
    }
  }, [effectiveBlacklist, isTempUser])

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
        const isWhitelisted = item.risk === 'WL'
        
        if (profile && !isWhitelisted) {
          const effectiveMinSignal = getEffectiveMinSignal(
            profile.min_signal_strength,
            profile.speed_network_preference
          )
          const effectiveMaxRisk = getEffectiveMaxRisk(
            profile.max_risk_level,
            profile.confidence_level,
            profile.profile_type
          )

          const isSpeedPriority = profile.profiling_preference === 'speed'
          const isSecurityPriority = profile.profiling_preference === 'security'

          if (profile.preferred_authentication && profile.preferred_authentication.length > 0) {
            const hasPreferredAuth = profile.preferred_authentication.some(auth =>
              item.authentication?.toLowerCase().includes(auth.toLowerCase())
            )
            if (!hasPreferredAuth) return false
          }

          const signalStrength = parseInt(item.signal?.replace('%', '') || '0')
          if (signalStrength < effectiveMinSignal) return false

          const itemRiskValue = riskLevelValue[item.risk] || 4
          const maxRiskValue = riskLevelValue[effectiveMaxRisk] || 4
          if (profile.confidence_level === 'low') {
          } else if (itemRiskValue > maxRiskValue) {
            return false
          }

          if (isSecurityPriority && itemRiskValue > 2) {
            return false
          }

          if (isSpeedPriority && signalStrength < effectiveMinSignal * 0.8) {
            if (signalStrength < effectiveMinSignal * 0.6) return false
          }

          if (profile.profile_type === 'work') {
            const secureAuth = ['WPA3', 'WPA2'].some(auth =>
              item.authentication?.toLowerCase().includes(auth.toLowerCase())
            )
            if (!secureAuth) return false
            if (itemRiskValue > 2) return false
          }
        }

        if (chipMappedRisk && item.risk !== chipMappedRisk) {
          return false
        }

        if (!term) return true

        const matchesRisk = mappedRisk ? item.risk === mappedRisk : false
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
      <h1 className="font-bold text-lg small-laptop:text-xl normal-laptop:text-[20px] mb-2 small-laptop:mb-[10px]" data-tour="scanner-title">Risk Assesment & Detection System</h1>
      {!!activeNetwork?.ssid &&
        <div className="relative">
          <div onClick={onIsActive}
               className="bg-secondary text-white p-3 small-laptop:p-4 mb-3 small-laptop:mb-4 rounded-t shadow flex flex-col small-laptop:flex-row justify-between items-start small-laptop:items-center gap-2 small-laptop:gap-0 cursor-pointer"
               data-tour="current-network">
            <div className="flex-1">
              <p className="font-semibold text-sm small-laptop:text-base">Connected to: <span className="text-green-300">{activeNetwork.ssid}</span>
              </p>
            </div>
            <div className="w-full small-laptop:w-[120px]">
              <Button onClick={disconnect} variant="red" >Disconnect</Button>
            </div>
          </div>
          {isActive &&
            <div className="bg-[rgb(70,8,118)] text-white p-4 small-laptop:p-5 rounded-b shadow absolute top-[auto] small-laptop:top-[72px] left-0 right-0 small-laptop:right-auto z-10"
                 data-tour="network-details">
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
        <Button variant="secondary" onClick={scanWifi} data-tour="scan-button">
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
          data-tour="scanner-search"
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
        <Table 
          tableTitle={tableTitle} 
          notDataFound={!networks.length && !isScanning} 
          minH='min-h-[300px] small-laptop:min-h-[400px]' 
          maxH='max-h-[400px]'
          isLoading={isScanning}
          columnWidths={['20%', '15%', '15%', '18%', '10%', '12%']}
          onSort={(column) => {
            setSortConfig(prev => {
              if (prev?.key === column) {
                return { key: column, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
              }
              return { key: column, direction: 'asc' }
            })
          }}
          sortConfig={sortConfig}
        >
          {filterOnActiveNetwork()?.sort((a, b) => {
            if (!sortConfig) return 0
            
            const { key, direction } = sortConfig
            let aValue: any
            let bValue: any
            
            switch (key) {
              case 'SSID':
                aValue = a.ssid || ''
                bValue = b.ssid || ''
                break
              case 'Authentication':
                aValue = a.authentication || ''
                bValue = b.authentication || ''
                break
              case 'Encryption':
                aValue = a.encryption || ''
                bValue = b.encryption || ''
                break
              case 'BSSID':
                aValue = a.bssid || ''
                bValue = b.bssid || ''
                break
              case 'Signal':
                const parseSignal = (signal: string | undefined): number => {
                  if (!signal) return 0
                  const cleaned = signal.toString().replace(/[^0-9.]/g, '')
                  const parsed = parseFloat(cleaned)
                  return isNaN(parsed) ? 0 : parsed
                }
                aValue = parseSignal(a.signal)
                bValue = parseSignal(b.signal)
                break
              case 'Risk':
                const riskOrder = { 'WL': 0, 'L': 1, 'M': 2, 'H': 3, 'C': 4 }
                aValue = riskOrder[a.risk as keyof typeof riskOrder] ?? 5
                bValue = riskOrder[b.risk as keyof typeof riskOrder] ?? 5
                break
              default:
                return 0
            }
            
            if (typeof aValue === 'string' && typeof bValue === 'string') {
              return direction === 'asc' 
                ? aValue.localeCompare(bValue)
                : bValue.localeCompare(aValue)
            }
            
            return direction === 'asc' ? aValue - bValue : bValue - aValue
          }).map((row, index) => (
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
