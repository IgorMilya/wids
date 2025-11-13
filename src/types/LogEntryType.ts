export interface LogEntryType {
  id: string
  user_id: string
  network_ssid: string
  network_bssid?: string
  action: string
  timestamp: string
  details?: string
}
