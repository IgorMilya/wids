// import React, { FC, useState, useEffect } from 'react'
// import { Button } from 'UI'
// import { invoke } from '@tauri-apps/api/core'
// import { load } from '@tauri-apps/plugin-store'
// import {
//   useGetMonitoringPreferencesQuery,
//   useUpdateMonitoringPreferencesMutation,
//   useGetBlacklistQuery,
//   useGetWhitelistQuery,
// } from 'store/api'
// import { useNotifications } from 'hooks'

// const THREAT_TYPES = [
//   { value: 'mac_spoof', label: 'MAC Spoofing' },
//   { value: 'deauth_attack', label: 'Deauth Attacks' },
//   { value: 'flood_attack', label: 'Flood Attacks' },
//   { value: 'unauthorized_client', label: 'Unauthorized Clients' },
//   { value: 'probe_anomaly', label: 'Probe Anomalies' },
//   { value: 'rf_jamming', label: 'RF Jamming' },
//   { value: 'blacklisted_network', label: 'Blacklisted Networks' },
// ]

// const MonitoringSettings: FC = () => {
//   const { data: preferences, isLoading: preferencesLoading, refetch: refetchPreferences } = useGetMonitoringPreferencesQuery()
//   const [updatePreferences] = useUpdateMonitoringPreferencesMutation()
//   const { data: blacklist = [] } = useGetBlacklistQuery()
//   const { data: whitelist = [] } = useGetWhitelistQuery()
//   const { addNotification } = useNotifications()

//   const [enabled, setEnabled] = useState(false)
//   const [intervalSeconds, setIntervalSeconds] = useState(10)
//   const [alertTypes, setAlertTypes] = useState<string[]>([])
//   const [isMonitoring, setIsMonitoring] = useState(false)
//   const [isSaving, setIsSaving] = useState(false)

//   // Load preferences when they're available
//   useEffect(() => {
//     if (preferences) {
//       setEnabled(preferences.enabled)
//       setIntervalSeconds(preferences.interval_seconds)
//       setAlertTypes(preferences.alert_types || [])
//     }
//   }, [preferences])

//   // Check monitoring status on mount and periodically
//   useEffect(() => {
//     checkMonitoringStatus()
//     const interval = setInterval(checkMonitoringStatus, 2000) // Check every 2 seconds
//     return () => clearInterval(interval)
//   }, [])

//   const checkMonitoringStatus = async () => {
//     try {
//       const status = await invoke<boolean>('get_monitoring_status')
//       setIsMonitoring(status)
//     } catch (error) {
//       console.error('Failed to check monitoring status:', error)
//     }
//   }

//   const handleToggleAlertType = (threatType: string) => {
//     setAlertTypes((prev) =>
//       prev.includes(threatType)
//         ? prev.filter((t) => t !== threatType)
//         : [...prev, threatType]
//     )
//   }

//   const handleSave = async () => {
//     setIsSaving(true)
//     try {
//       await updatePreferences({
//         enabled,
//         interval_seconds: intervalSeconds,
//         alert_types: alertTypes,
//       }).unwrap()

//       addNotification({
//         type: 'success',
//         severity: 'Low',
//         title: 'Preferences Saved',
//         message: 'Monitoring preferences have been saved successfully.',
//       })

//       // Reload preferences
//       await refetchPreferences()
//     } catch (error: any) {
//       addNotification({
//         type: 'error',
//         severity: 'Medium',
//         title: 'Save Failed',
//         message: error?.data?.error || error?.message || 'Failed to save preferences',
//       })
//     } finally {
//       setIsSaving(false)
//     }
//   }

//   const handleStartMonitoring = async () => {
//     if (!preferences) return

//     try {
//       const token = localStorage.getItem('token') || ''
//       const serverUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

//       await invoke('start_monitoring', {
//         serverUrl: serverUrl,
//         authToken: token,
//         intervalSeconds: intervalSeconds,
//         enabledThreatTypes: alertTypes.length > 0 ? alertTypes : THREAT_TYPES.map((t) => t.value),
//         whitelist: whitelist.map((w) => w.bssid.toLowerCase()),
//         blacklist: blacklist.map((b) => b.bssid.toLowerCase()),
//       })

//       setIsMonitoring(true)
//       addNotification({
//         type: 'success',
//         severity: 'Low',
//         title: 'Monitoring Started',
//         message: 'Background monitoring has been started successfully.',
//       })

//       // Save preferences if changed
//       if (preferences.enabled !== enabled || preferences.interval_seconds !== intervalSeconds || JSON.stringify(preferences.alert_types) !== JSON.stringify(alertTypes)) {
//         await handleSave()
//       }
//     } catch (error: any) {
//       addNotification({
//         type: 'error',
//         severity: 'High',
//         title: 'Start Failed',
//         message: error?.toString() || 'Failed to start monitoring',
//       })
//     }
//   }

//   const handleStopMonitoring = async () => {
//     try {
//       await invoke('stop_monitoring')
//       setIsMonitoring(false)
//       addNotification({
//         type: 'info',
//         severity: 'Low',
//         title: 'Monitoring Stopped',
//         message: 'Background monitoring has been stopped.',
//       })
//     } catch (error: any) {
//       addNotification({
//         type: 'error',
//         severity: 'Medium',
//         title: 'Stop Failed',
//         message: error?.toString() || 'Failed to stop monitoring',
//       })
//     }
//   }

//   if (preferencesLoading) {
//     return (
//       <div className="p-5 w-full flex items-center justify-center min-h-screen">
//         <div className="text-xl">Loading monitoring settings...</div>
//       </div>
//     )
//   }

//   return (
//     <div className="p-5 w-full max-w-4xl mx-auto">
//       <h1 className="text-3xl font-bold mb-6 text-gray-800">Monitoring Settings</h1>

//       {/* Enable/Disable Toggle */}
//       <div className="bg-white p-6 rounded-lg shadow-md mb-6">
//         <div className="flex items-center justify-between mb-4">
//           <div>
//             <h2 className="text-xl font-bold text-gray-800 mb-2">Background Monitoring</h2>
//             <p className="text-sm text-gray-600">
//               Continuously monitor Wi-Fi networks for threats and attacks
//             </p>
//           </div>
//           <label className="relative inline-flex items-center cursor-pointer">
//             <input
//               type="checkbox"
//               checked={enabled}
//               onChange={(e) => setEnabled(e.target.checked)}
//               className="sr-only peer"
//             />
//             <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600"></div>
//           </label>
//         </div>

//         {/* Monitoring Status */}
//         <div className="mt-4 p-4 bg-gray-50 rounded-lg">
//           <div className="flex items-center justify-between">
//             <div>
//               <span className="text-sm font-medium text-gray-700">Status: </span>
//               <span
//                 className={`text-sm font-bold ${
//                   isMonitoring ? 'text-green-600' : 'text-gray-600'
//                 }`}
//               >
//                 {isMonitoring ? 'Active' : 'Inactive'}
//               </span>
//             </div>
//             <div className="flex gap-2">
//               {isMonitoring ? (
//                 <Button
//                   onClick={handleStopMonitoring}
//                   variant="red"
//                   className="text-sm"
//                 >
//                   Stop Monitoring
//                 </Button>
//               ) : (
//                 <Button
//                   onClick={handleStartMonitoring}
//                   variant="primary"
//                   className="text-sm"
//                   disabled={!enabled}
//                 >
//                   Start Monitoring
//                 </Button>
//               )}
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Scan Interval */}
//       <div className="bg-white p-6 rounded-lg shadow-md mb-6">
//         <h2 className="text-xl font-bold text-gray-800 mb-4">Scan Interval</h2>
//         <div className="flex items-center gap-4">
//           <input
//             type="range"
//             min="5"
//             max="60"
//             value={intervalSeconds}
//             onChange={(e) => setIntervalSeconds(parseInt(e.target.value))}
//             className="flex-1"
//           />
//           <div className="w-24 text-right">
//             <span className="text-2xl font-bold text-gray-800">{intervalSeconds}</span>
//             <span className="text-sm text-gray-600 ml-1">seconds</span>
//           </div>
//         </div>
//         <p className="text-xs text-gray-500 mt-2">
//           How often to scan for threats (5-60 seconds). Default: 10 seconds
//         </p>
//       </div>

//       {/* Alert Types */}
//       <div className="bg-white p-6 rounded-lg shadow-md mb-6">
//         <h2 className="text-xl font-bold text-gray-800 mb-4">Threat Types to Alert On</h2>
//         <p className="text-sm text-gray-600 mb-4">
//           Select which threat types should trigger alerts. Leave empty to alert on all threats.
//         </p>
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
//           {THREAT_TYPES.map((threat) => (
//             <label
//               key={threat.value}
//               className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
//             >
//               <input
//                 type="checkbox"
//                 checked={alertTypes.includes(threat.value)}
//                 onChange={() => handleToggleAlertType(threat.value)}
//                 className="mr-3 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
//               />
//               <span className="text-sm font-medium text-gray-700">{threat.label}</span>
//             </label>
//           ))}
//         </div>
//       </div>

//       {/* Save Button */}
//       <div className="flex justify-end gap-4">
//         <Button
//           onClick={handleSave}
//           variant="primary"
//           disabled={isSaving}
//           className="px-6 py-2"
//         >
//           {isSaving ? 'Saving...' : 'Save Preferences'}
//         </Button>
//       </div>
//     </div>
//   )
// }

// export default MonitoringSettings

