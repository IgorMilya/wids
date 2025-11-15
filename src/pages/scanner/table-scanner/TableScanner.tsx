import React, { FC, useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { useAddBlacklistMutation, useAddWhitelistMutation, useAddLogMutation } from 'store/api'
import { Button, Chip, Modal } from 'UI'
import { WifiNetworkType } from 'types'
import { useIsModal } from 'hooks'
import { getNetworkVerdict } from '../scanner.utils'

interface TableScannerProps {
  data: WifiNetworkType,
  isShowNetwork: boolean,
  onToggle: () => void
  onFetchActiveNetwork: () => void
}

const TableScanner: FC<TableScannerProps> = ({ data, isShowNetwork, onToggle, onFetchActiveNetwork }) => {
  const { bssid, risk, signal, ssid, encryption, authentication, is_evil_twin } = data
  const { isOpen, handleToggleIsOpenModal } = useIsModal()
  const [addBlacklist, { isLoading: isAdding }] = useAddBlacklistMutation()
  const [addWhitelist, { isLoading: isAddingWhitelist }] = useAddWhitelistMutation()
  const [isConnecting, setIsConnecting] = useState(false)
  const [addLog] = useAddLogMutation()       //  ← LOGGING HERE
  const { description, verdict } = getNetworkVerdict(data)

  const logAction = (action: string, details?: string) => {
    addLog({
      network_ssid: ssid || 'Hidden',
      network_bssid: bssid || undefined,
      action,
      details,
    })
  }
  const connectToWifi = async (ssid: string) => {
    setIsConnecting(true)
      logAction('CONNECT_ATTEMPT', `Trying to connect to ${ssid}`)
    try {
      const result = await invoke<string>('connect_wifi', {
        ssid,
        password: null,
        authentication: authentication,
      })
      alert(result)
      logAction('CONNECTED', `Connected successfully: ${result}`)
      onFetchActiveNetwork()
    } catch (error: any) {
      const errMessage = typeof error === 'string' ? error : error.toString()
      logAction('CONNECT_FAILED', errMessage)

      const shouldPrompt =
        errMessage.includes('Password may have changed') ||
        errMessage.includes('Password is required for new or failed networks.') ||
        errMessage.includes('Password is required for secured networks.') ||
        errMessage.toLowerCase().includes('unable to connect')

      if (shouldPrompt) {
        const password = prompt(`Connection failed. Enter new password for "${ssid}":`)
        if (!password) {
          alert('Password is required to connect.')
          return
        }

        try {
          const retry = await invoke<string>('connect_wifi', {
            ssid,
            password,
            authentication: authentication,
          })
          alert(retry)
          logAction('CONNECTED_RETRY', `Connected after password retry`)
          onFetchActiveNetwork()
        } catch (finalError: any) {
          logAction('CONNECT_RETRY_FAILED', finalError.toString())
          alert('Still failed to connect: ' + finalError)
        }
      } else {
        alert('Connection failed: ' + errMessage)
      }
    } finally {
      setIsConnecting(false)
    }
  }


  const handleOpenModal = (ssid: string) => {
    if (risk === 'H' || risk === 'C') {
      logAction('CONNECT_RISK_WARNING', `User warned before connecting: risk ${risk}`)
      handleToggleIsOpenModal()
    } else {
      connectToWifi(ssid)
    }
  }

  const handleBlacklist = async (ssid: string, bssid: string) => {
    if (!ssid || !bssid) {
      alert('Cannot blacklist a hidden network without SSID or BSSID')
      return
    }
    try {
      const reason = prompt('Enter reason for blacklisting:') || 'Manually added'
      await addBlacklist({ ssid, bssid, reason }).unwrap()
      logAction('BLACKLIST_ADD', reason)
      alert(`Network ${ssid} has been added to blacklist`)
    } catch (error) {
      logAction('BLACKLIST_ADD_FAILED', JSON.stringify(error))
      alert('Failed to add network to blacklist: ' + JSON.stringify(error))
    }
  }

  const handleWhitelist = async (ssid: string, bssid: string) => {
    if (!ssid || !bssid) {
      alert('Cannot whitelist a hidden network without SSID or BSSID')
      return
    }
    try {
      await addWhitelist({ ssid, bssid }).unwrap()
      logAction('WHITELIST_ADD', 'Added to whitelist')
      alert(`Network ${ssid} has been added to whitelist`)
    } catch (error) {
      logAction('WHITELIST_ADD_FAILED', JSON.stringify(error))
      alert('Failed to add network to whitelist: ' + JSON.stringify(error))
    }
  }

  return (
    <>
      <tr onClick={onToggle}
          className={`border-b border-gray-700 text-center hover:bg-gray-100 transition ${isShowNetwork ? 'bg-[rgba(232,231,231,1)]' : ''}`}>
        <td className="p-3">
          {!ssid ? 'Hidden Network' : (
            <>
              {ssid}
              {is_evil_twin && risk !== 'WL' && <span className="ml-2 text-red-600 font-bold">(Evil Twin)</span>}
            </>
          )}
        </td>
        <td className="p-3">{!authentication ? 'Hidden Network' : authentication}</td>
        <td className="p-3">{!encryption ? 'Hidden Network' : encryption}</td>
        <td className="p-3">{!bssid ? 'Hidden Network' : bssid}</td>
        <td className="p-3">{!signal ? 'Hidden Network' : signal}</td>
        <td className="p-3"><Chip risk={risk} /></td>


      </tr>

      {isShowNetwork && (
        <tr className="bg-[rgba(232,231,231,1)]">
          <td colSpan={6} className="p-5">
            <div className="flex gap-5">
              <div className="w-[150px]">
                <Button
                  onClick={() => handleOpenModal(ssid)}
                  variant="secondary"
                  disabled={isConnecting}
                >
                  {isConnecting ? 'Connecting...' : 'Connect'}
                </Button>
              </div>
              <div className="w-[150px]">
                <Button onClick={() => handleBlacklist(ssid, bssid)} variant="red"
                        disabled={isAdding || risk === 'WL'}>Blacklist</Button>
              </div>
              <div className="w-[150px]">
                <Button onClick={() => handleWhitelist(ssid, bssid)} variant="primary"
                        disabled={isAddingWhitelist || risk === 'WL'}>Whitelist</Button>
              </div>
            </div>

            <div className="mt-4 p-3 bg-white rounded border text-gray-800 whitespace-pre-line">
              <p>{description}</p>
              <p className="mt-2 font-semibold">{verdict}</p>
            </div>
          </td>
        </tr>
      )}

      <Modal title="Alert" isOpen={isOpen} buttonText="Confirm" onClose={handleToggleIsOpenModal}
             onConfirm={() => connectToWifi(ssid)}>
        Risk of this network ({ssid}) is {risk}. Do you really want to connect?
      </Modal>
    </>
  )
}

export default TableScanner