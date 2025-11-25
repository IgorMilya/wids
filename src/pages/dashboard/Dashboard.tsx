import { useState } from 'react'
import { invoke } from '@tauri-apps/api/core'

const Dashboard = () => {
  const [networks, setNetworks] = useState<string[]>([])
  async function scanWifi() {
    const result = await invoke<string[]>('scan_wifi')
    setNetworks(result)
  }

  return (
    <div className="p-3 small-laptop:p-4 normal-laptop:p-5 w-full">
      <h1 className="font-bold text-lg small-laptop:text-xl normal-laptop:text-[20px] mb-4">Dashboard</h1>
      <p>Dashboard content coming soon...</p>
    </div>
  )
}

export default Dashboard
