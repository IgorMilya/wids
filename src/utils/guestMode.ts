import { store } from 'store'
import { setIsTempUser, setDeviceId, setCachedNetworks } from 'store/reducers/user.slice'
import { getDeviceId } from './deviceId'
import { loadNetworkCache } from './cacheManager'

/**
 * Enable guest (temp user) mode
 * Loads cached networks for the device and enables temp user access
 */
export const enableGuestMode = async (): Promise<void> => {
  try {
    const deviceId = await getDeviceId()
    const cache = await loadNetworkCache(deviceId)

    if (cache) {
      store.dispatch(setDeviceId(deviceId))
      store.dispatch(setCachedNetworks({
        whitelist: cache.whitelist,
        blacklist: cache.blacklist,
        cachedAt: cache.cachedAt,
      }))
      store.dispatch(setIsTempUser(true))
      console.log('Guest mode enabled with cached networks:', {
        whitelistCount: cache.whitelist.length,
        blacklistCount: cache.blacklist.length,
      })
    } else {
      // No cache available, but still enable guest mode for scanning
      store.dispatch(setDeviceId(deviceId))
      store.dispatch(setCachedNetworks({
        whitelist: [],
        blacklist: [],
        cachedAt: null,
      }))
      store.dispatch(setIsTempUser(true))
      console.log('Guest mode enabled (no cached networks)')
    }
  } catch (error) {
    console.error('Failed to enable guest mode:', error)
    throw error
  }
}

