import { useAddBlacklistMutation, useDeleteBlacklistMutation } from 'store/api'
import { useLogger } from './useLogger'

export const useBlacklistActions = () => {
  const [addBlacklist] = useAddBlacklistMutation()
  const [deleteBlacklist] = useDeleteBlacklistMutation()
  const { log } = useLogger()

  const add = async (ssid: string, bssid: string, reason?: string) => {
    await addBlacklist({ ssid, bssid, reason })
    await log({
      ssid,
      bssid,
      action: "Blacklist Added",
      details: reason || "User added network to blacklist"
    })
  }

  const remove = async (id: string, ssid: string, bssid?: string) => {
    await deleteBlacklist(id)
    await log({
      ssid,
      bssid,
      action: "Blacklist Removed",
      details: "User removed network from blacklist"
    })
  }

  return { add, remove }
}
