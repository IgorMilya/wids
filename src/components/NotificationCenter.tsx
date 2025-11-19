import React from 'react'
import { Notification, useNotifications } from 'hooks/useNotifications'

interface NotificationCenterProps {
  notifications: Notification[]
  onRemove: (id: string) => void
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ notifications, onRemove }) => {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Critical':
        return 'bg-red-600 border-red-700'
      case 'High':
        return 'bg-orange-600 border-orange-700'
      case 'Medium':
        return 'bg-yellow-600 border-yellow-700'
      case 'Low':
        return 'bg-blue-600 border-blue-700'
      default:
        return 'bg-gray-600 border-gray-700'
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'Critical':
        return '🚨'
      case 'High':
        return '⚠️'
      case 'Medium':
        return '⚡'
      case 'Low':
        return 'ℹ️'
      default:
        return '📢'
    }
  }

  if (notifications.length === 0) {
    return null
  }

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`
            ${getSeverityColor(notification.severity)}
            text-white rounded-lg shadow-lg p-4 border-l-4
            animate-slide-in-right
            transition-all duration-300
            hover:shadow-xl
          `}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              <span className="text-2xl flex-shrink-0">{getSeverityIcon(notification.severity)}</span>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-sm mb-1">{notification.title}</h4>
                <p className="text-xs opacity-90 mb-2">{notification.message}</p>
                {notification.networkSsid && (
                  <div className="text-xs opacity-75 mt-1">
                    <span className="font-semibold">Network:</span> {notification.networkSsid}
                    {notification.networkBssid && (
                      <span className="ml-2 font-mono">{notification.networkBssid}</span>
                    )}
                  </div>
                )}
                {notification.threatType && (
                  <div className="text-xs opacity-75 mt-1">
                    <span className="font-semibold">Threat Type:</span> {notification.threatType.replace(/_/g, ' ')}
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={() => onRemove(notification.id)}
              className="ml-3 text-white opacity-75 hover:opacity-100 transition-opacity flex-shrink-0"
              aria-label="Dismiss notification"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

export default NotificationCenter

