import { load } from '@tauri-apps/plugin-store'

const DEVICE_CACHE_FILE = 'device_cache.json'
const DEVICE_ID_KEY = 'device_id'

/**
 * Generate a UUID v4
 */
const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/**
 * Get or create a stable device ID for this device
 * Device ID is stored in Tauri plugin-store and persists across app restarts
 */
export const getDeviceId = async (): Promise<string> => {
  try {
    const store = await load(DEVICE_CACHE_FILE, { autoSave: false })
    let deviceId = await store.get<string>(DEVICE_ID_KEY)

    if (!deviceId) {
      // Generate new device ID
      deviceId = generateUUID()
      await store.set(DEVICE_ID_KEY, deviceId)
      await store.save()
    }

    return deviceId
  } catch (error) {
    console.error('Failed to get device ID:', error)
    // Fallback to localStorage if Tauri store fails
    let deviceId = localStorage.getItem(DEVICE_ID_KEY)
    if (!deviceId) {
      deviceId = generateUUID()
      localStorage.setItem(DEVICE_ID_KEY, deviceId)
    }
    return deviceId
  }
}

