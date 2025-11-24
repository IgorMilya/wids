// import { useState, useCallback } from 'react'

// export interface Notification {
//   id: string
//   type: 'success' | 'error' | 'warning' | 'info' | 'threat'
//   severity: 'Critical' | 'High' | 'Medium' | 'Low'
//   title: string
//   message: string
//   timestamp: Date
//   threatType?: string
//   networkSsid?: string
//   networkBssid?: string
// }

// export const useNotifications = () => {
//   const [notifications, setNotifications] = useState<Notification[]>([])

//   const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp'>) => {
//     const newNotification: Notification = {
//       ...notification,
//       id: `notification-${Date.now()}-${Math.random()}`,
//       timestamp: new Date(),
//     }

//     setNotifications((prev) => [...prev, newNotification])

//     // Auto-dismiss after 5 seconds (10 seconds for Critical threats)
//     const dismissTime = notification.severity === 'Critical' ? 10000 : 5000
//     setTimeout(() => {
//       removeNotification(newNotification.id)
//     }, dismissTime)
//   }, [])

//   const removeNotification = useCallback((id: string) => {
//     setNotifications((prev) => prev.filter((n) => n.id !== id))
//   }, [])

//   const clearAll = useCallback(() => {
//     setNotifications([])
//   }, [])

//   return {
//     notifications,
//     addNotification,
//     removeNotification,
//     clearAll,
//   }
// }

