import { useAddLogMutation } from 'store/api'

export const useLogger = () => {
  const [addLog] = useAddLogMutation()

  const log = async (params: {
    ssid: string
    bssid?: string
    action: string
    details?: string
  }) => {
    try {
      await addLog({
        network_ssid: params.ssid,
        network_bssid: params.bssid,
        action: params.action,
        details: params.details,
      })
    } catch (e) {
      console.error("Failed to write log:", e)
    }
  }

  return { log }
}
