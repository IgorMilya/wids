import { useLogger } from './useLogger'

export const useWifiActions = () => {
  const { log } = useLogger()

  const connect = async (ssid: string, bssid: string) => {

    await log({
      ssid,
      bssid,
      action: "Connected",
      details: "User connected to WiFi"
    })
  }

  const disconnect = async (ssid: string, bssid: string) => {

    await log({
      ssid,
      bssid,
      action: "DISCONNECTED",
      details: "User disconnected from WiFi"
    })
  }

  return { connect, disconnect }
}
