import { store } from 'store'
import { setIsTempUser, setDeviceId, setCachedNetworks } from 'store/reducers/user.slice'
import { getDeviceId } from './deviceId'
import { loadNetworkCache } from './cacheManager'

export const enableGuestMode = async (): Promise<void> => {
  try {
    const deviceId = await getDeviceId()
    console.log('deviceId', deviceId);
    const cache = await loadNetworkCache(deviceId)
    console.log('cache', cache);

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

