import { useState, useEffect } from 'react'
import { useGetLogsQuery } from 'store/api'
import { Table } from 'UI'

const Logs = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [searchAction, setSearchAction] = useState('')
  const [searchDate, setSearchDate] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 500)
    return () => clearTimeout(handler)
  }, [searchTerm])

  const { data, isLoading, isError, error } = useGetLogsQuery(
    debouncedSearchTerm || searchAction || searchDate
      ? { ssid: debouncedSearchTerm || undefined, action: searchAction || undefined, date: searchDate || undefined }
      : undefined
  )

  return (
    <div className="p-5 w-full">
      <h1 className="text-xl font-bold mb-4">User Logs</h1>

      <div className="mb-4 flex gap-2">
        <input type="text" placeholder="SSID" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="border px-3 py-2 rounded"/>
        <input type="text" placeholder="Action" value={searchAction} onChange={e => setSearchAction(e.target.value)} className="border px-3 py-2 rounded"/>
        <input type="date" value={searchDate} onChange={e => setSearchDate(e.target.value)} className="border px-3 py-2 rounded"/>
      </div>

      {isError && <p className="text-red-500">{String(error)}</p>}
      {isLoading ? <p>Loading...</p> : (
        <Table tableTitle={['SSID','BSSID','Action','Timestamp','Details']} notDataFound={!data?.length}>
          {data?.map((log) => (
            <tr key={log.id}>
              <td>{log.network_ssid}</td>
              <td>{log.network_bssid || '-'}</td>
              <td>{log.action}</td>
              <td>{new Date(log.timestamp).toLocaleString()}</td>
              <td>{log.details || '-'}</td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  )
}

export default Logs
