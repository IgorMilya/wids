import { useState, useEffect, useMemo } from 'react'
import { useGetLogsQuery } from 'store/api'
import { Button, Table } from 'UI'
import TableLogs from './table-logs/TableLogs'

const Logs = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [searchAction, setSearchAction] = useState('')
  const [searchDate, setSearchDate] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const limit = 11
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 500)
    return () => clearTimeout(handler)
  }, [searchTerm])

  const { data, isLoading, isError, error } = useGetLogsQuery({
    ssid: debouncedSearchTerm || undefined,
    action: searchAction || undefined,
    date: searchDate || undefined,
    page,
    limit,
  })

  const logs = data?.logs ?? []
  const total = data?.total ?? 0
  const totalPages = Math.ceil(total / limit)

  const sortedData = useMemo(() => {
    if (!sortConfig) return logs

    const sorted = [...logs].sort((a, b) => {
      let aValue: string | number | undefined
      let bValue: string | number | undefined

      // Map column names to actual keys if needed
      switch (sortConfig.key) {
        case 'SSID':
          aValue = a.network_ssid
          bValue = b.network_ssid
          break
        case 'BSSID':
          aValue = a.network_bssid
          bValue = b.network_bssid
          break
        case 'Action':
          aValue = a.action
          bValue = b.action
          break
        case 'Timestamp':
          aValue = new Date(a.timestamp).getTime()
          bValue = new Date(b.timestamp).getTime()
          break
        case 'Details':
          aValue = a.details
          bValue = b.details
          break
        default:
          aValue = ''
          bValue = ''
      }

      if (aValue === undefined) aValue = ''
      if (bValue === undefined) bValue = ''

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
      return 0
    })

    return sorted
  }, [logs, sortConfig])


  const handleSort = (column: string) => {
    setSortConfig(prev => {
      if (prev?.key === column) {
        return { key: column, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
      }
      return { key: column, direction: 'asc' }
    })
  }

  const exportToCSV = () => {
    if (!sortedData.length) return;

    // CSV header
    const headers = ['SSID', 'BSSID', 'Action', 'Timestamp', 'Details'];
    const rows = sortedData.map(log => [
      log.network_ssid,
      log.network_bssid || '-',
      log.action,
      new Date(log.timestamp).toLocaleString(),
      log.details || '-'
    ]);

    const csvContent =
      [headers, ...rows]
        .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
        .join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `logs_page_${page}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  return (
    <div className="p-5 w-full">
      <h1 className="text-xl font-bold mb-4">User Logs</h1>

      <div className="mb-4 flex gap-2">
        <input type="text" placeholder="SSID" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
               className="border px-3 py-2 rounded" />
        <input type="text" placeholder="Action" value={searchAction} onChange={e => setSearchAction(e.target.value)}
               className="border px-3 py-2 rounded" />
        <input type="date" value={searchDate} onChange={e => setSearchDate(e.target.value)}
               className="border px-3 py-2 rounded" />
        <Button onClick={exportToCSV} type="button" variant="outline">
          Export CSV
        </Button>
      </div>

      {isError && <p className="text-red-500">{String(error)}</p>}
      {isLoading ? <p>Loading...</p> : (
        <Table tableTitle={['SSID', 'BSSID', 'Action', 'Timestamp', 'Details']} notDataFound={!sortedData.length}
               onSort={handleSort} sortConfig={sortConfig}>
          {sortedData.map((log ) => (
            <TableLogs log={log} key={log.id} />
          ))}
        </Table>
      )}
      {!!logs.length &&
        <div className="flex gap-2 mt-4 items-center">
          <button disabled={page === 1} onClick={() => setPage(page - 1)}>Prev</button>
          <span> {page} of {totalPages}</span>
          <button disabled={page === totalPages} onClick={() => setPage(page + 1)}>Next</button>
        </div>
      }
    </div>
  )
}

export default Logs
