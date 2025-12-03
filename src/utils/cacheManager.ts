import { load } from '@tauri-apps/plugin-store'
import { WhitelistedNetworkType, BlacklistedNetworkType } from 'types'

const NETWORK_CACHE_FILE = 'network_cache.json'
const MAX_WHITELIST_CACHE = 50
const MAX_BLACKLIST_CACHE = 50

export interface NetworkCache {
  deviceId: string
  whitelist: WhitelistedNetworkType[]
  blacklist: BlacklistedNetworkType[]
  cachedAt: number
}

/**
 * Save network cache for a device
 * Limits to 50 whitelist + 50 blacklist (most recent)
 */
export const saveNetworkCache = async (
  deviceId: string,
  whitelist: WhitelistedNetworkType[],
  blacklist: BlacklistedNetworkType[]
): Promise<void> => {
  try {
    const store = await load(NETWORK_CACHE_FILE, { autoSave: false })
    
    // Limit to most recent networks
    const limitedWhitelist = whitelist.slice(0, MAX_WHITELIST_CACHE)
    const limitedBlacklist = blacklist.slice(0, MAX_BLACKLIST_CACHE)

    const cache: NetworkCache = {
      deviceId,
      whitelist: limitedWhitelist,
      blacklist: limitedBlacklist,
      cachedAt: Date.now(),
    }

    // Store cache by device ID
    await store.set(deviceId, cache)
    await store.save()
  } catch (error) {
    console.error('Failed to save network cache:', error)
    // Fallback to localStorage if Tauri store fails
    try {
      const cache: NetworkCache = {
        deviceId,
        whitelist: whitelist.slice(0, MAX_WHITELIST_CACHE),
        blacklist: blacklist.slice(0, MAX_BLACKLIST_CACHE),
        cachedAt: Date.now(),
      }
      localStorage.setItem(`network_cache_${deviceId}`, JSON.stringify(cache))
    } catch (localError) {
      console.error('Failed to save network cache to localStorage:', localError)
    }
  }
}

/**
 * Load network cache for a device
 */
export const loadNetworkCache = async (deviceId: string): Promise<NetworkCache | null> => {
  try {
    const store = await load(NETWORK_CACHE_FILE, { autoSave: false })
    const cache = await store.get<NetworkCache>(deviceId)

    if (cache && cache.deviceId === deviceId) {
      return cache
    }

    return null
  } catch (error) {
    console.error('Failed to load network cache:', error)
    // Fallback to localStorage if Tauri store fails
    try {
      const cached = localStorage.getItem(`network_cache_${deviceId}`)
      if (cached) {
        return JSON.parse(cached) as NetworkCache
      }
    } catch (localError) {
      console.error('Failed to load network cache from localStorage:', localError)
    }
    return null
  }
}

/**
 * Clear network cache for a device
 */
export const clearNetworkCache = async (deviceId: string): Promise<void> => {
  try {
    const store = await load(NETWORK_CACHE_FILE, { autoSave: false })
    await store.delete(deviceId)
    await store.save()
  } catch (error) {
    console.error('Failed to clear network cache:', error)
    // Fallback to localStorage
    try {
      localStorage.removeItem(`network_cache_${deviceId}`)
    } catch (localError) {
      console.error('Failed to clear network cache from localStorage:', localError)
    }
  }
}

