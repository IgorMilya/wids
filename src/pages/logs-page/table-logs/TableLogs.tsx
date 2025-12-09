import React, { FC } from 'react'
import { LogEntryType } from 'types'
interface  TableLogsProps{
  log: LogEntryType
}

const TableLogs: FC<TableLogsProps> = ({ log,  }) => {
  const { network_ssid, network_bssid, timestamp, action, details } = log

  return (
    <>
      <tr className={`border-b border-gray-700 text-center hover:bg-gray-100 transition`}>
        <td className="p-3" style={{ width: '20%' }}>{network_ssid}</td>
        <td className="p-3" style={{ width: '18%' }}>{network_bssid || '-'}</td>
        <td className="p-3" style={{ width: '15%' }}>{action}</td>
        <td className="p-3" style={{ width: '20%' }}>{new Date(timestamp).toLocaleString()}</td>
        <td className="p-3" style={{ width: '27%' }}>{details || '-'}</td>
      </tr>
    </>
  )
}

export default TableLogs
