import { useAddWhitelistMutation, useDeleteWhitelistMutation } from 'store/api'
import { useLogger } from './useLogger'

export const useWhitelistActions = () => {
  const [addWhitelist] = useAddWhitelistMutation()
  const [deleteWhitelist] = useDeleteWhitelistMutation()
  const { log } = useLogger()

  const add = async (ssid: string, bssid: string) => {
    await addWhitelist({ ssid, bssid })
    await log({
      ssid,
      bssid,
      action: "Whitelist Added",
      details: "User added a network to whitelist"
    })
  }

  const remove = async (id: string, ssid: string, bssid?: string) => {
    await deleteWhitelist(id)
    await log({
      ssid,
      bssid,
      action: "Whitelist Removed",
      details: "User removed a network from whitelist"
    })
  }

  return { add, remove }
}
