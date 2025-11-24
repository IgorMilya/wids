import { Outlet } from 'react-router-dom'
// Real-time monitoring feature - COMMENTED OUT (will be re-enabled in future)
// import { useEffect, useRef } from 'react'
// import { listen } from '@tauri-apps/api/event'
// import { invoke } from '@tauri-apps/api/core'
import { Navbar } from 'UI'
// Real-time monitoring feature - COMMENTED OUT (will be re-enabled in future)
// import { NotificationCenter } from 'components'
// import { useNotifications } from 'hooks'
// import { useGetMonitoringPreferencesQuery, useGetBlacklistQuery, useGetWhitelistQuery } from 'store/api'
import { navLink } from './homeLayout.utils'

const HomeLayout = ()=> {
  // Real-time monitoring feature - COMMENTED OUT (will be re-enabled in future)
  // const { notifications, addNotification, removeNotification } = useNotifications()
  // const { data: preferences } = useGetMonitoringPreferencesQuery()
  // const { data: blacklist = [] } = useGetBlacklistQuery()
  // const { data: whitelist = [] } = useGetWhitelistQuery()
  // const initializedRef = useRef(false)

  // Initialize monitoring on app load if preferences are enabled
  // useEffect(() => {
  //   if (!preferences || initializedRef.current) return

  //   const initializeMonitoring = async () => {
  //     if (preferences.enabled) {
  //       try {
  //         const token = localStorage.getItem('token') || ''
  //         const serverUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

  //         // Check if already running
  //         const isRunning = await invoke<boolean>('get_monitoring_status')
          
  //         if (!isRunning) {
  //           await invoke('start_monitoring', {
  //             serverUrl: serverUrl,
  //             authToken: token,
  //             intervalSeconds: preferences.interval_seconds,
  //             enabledThreatTypes: preferences.alert_types.length > 0 
  //               ? preferences.alert_types 
  //               : [], // Empty means all threats
  //             whitelist: whitelist.map((w) => w.bssid.toLowerCase()),
  //             blacklist: blacklist.map((b) => b.bssid.toLowerCase()),
  //           })
  //         }
          
  //         initializedRef.current = true
  //       } catch (error) {
  //         console.error('Failed to initialize monitoring:', error)
  //       }
  //     }
  //   }

  //   initializeMonitoring()
  // }, [preferences, blacklist, whitelist])

  // useEffect(() => {
  //   // Listen for threat-detected events from Tauri backend
  //   const setupThreatListener = async () => {
  //     const unlisten = await listen<{
  //       threat_type: string
  //       severity: string
  //       network_ssid: string
  //       network_bssid: string
  //       details: string
  //     }>('threat-detected', (event) => {
  //       const { threat_type, severity, network_ssid, network_bssid, details } = event.payload

  //       addNotification({
  //         type: 'threat',
  //         severity: severity as 'Critical' | 'High' | 'Medium' | 'Low',
  //         title: `Threat Detected: ${threat_type.replace(/_/g, ' ')}`,
  //         message: details,
  //         threatType: threat_type,
  //         networkSsid: network_ssid,
  //         networkBssid: network_bssid,
  //       })
  //     })

  //     return unlisten
  //   }

  //   let cleanup: (() => void) | undefined
  //   setupThreatListener().then((unlisten) => {
  //     cleanup = unlisten
  //   })

  //   return () => {
  //     if (cleanup) cleanup()
  //   }
  // }, [addNotification])

  return (
    <div className="bg-primary h-screen">
      <div className="flex">
        <Navbar data={navLink} />
        <Outlet />
      </div>
      {/* Real-time monitoring feature - COMMENTED OUT (will be re-enabled in future) */}
      {/* <NotificationCenter notifications={notifications} onRemove={removeNotification} /> */}
    </div>
  )
}

export default HomeLayout
