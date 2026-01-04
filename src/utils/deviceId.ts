import { load } from '@tauri-apps/plugin-store'

const DEVICE_CACHE_FILE = 'device_cache.json'
const DEVICE_ID_KEY = 'device_id'

const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export const getDeviceId = async (): Promise<string> => {
  try {
    const store = await load(DEVICE_CACHE_FILE, { autoSave: false })
    let deviceId = await store.get<string>(DEVICE_ID_KEY)

    if (!deviceId) {
      deviceId = generateUUID()
      await store.set(DEVICE_ID_KEY, deviceId)
      await store.save()
    }

    return deviceId
  } catch (error) {
    console.error('Failed to get device ID:', error)
    let deviceId = localStorage.getItem(DEVICE_ID_KEY)
    if (!deviceId) {
      deviceId = generateUUID()
      localStorage.setItem(DEVICE_ID_KEY, deviceId)
    }
    return deviceId
  }
}

