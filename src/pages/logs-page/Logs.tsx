import { useState, useEffect } from 'react'
import { useGetLogsQuery, useLazyExportLogsQuery } from 'store/api'
import { Button, Table } from 'UI'
import TableLogs from './table-logs/TableLogs'

const Logs = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [searchAction, setSearchAction] = useState('')
  const [searchDateFrom, setSearchDateFrom] = useState('')
  const [searchDateTill, setSearchDateTill] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const limit = 11
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null)
  const [isExporting, setIsExporting] = useState(false)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 500)
    return () => clearTimeout(handler)
  }, [searchTerm])

  const { data, isLoading, isError, error } = useGetLogsQuery({
    ssid: debouncedSearchTerm.trim() || undefined,
    action: searchAction.trim() || undefined,
    date_from: searchDateFrom.trim() || undefined,
    date_till: searchDateTill.trim() || undefined,
    page,
    limit,
    sort_by: sortConfig?.key || undefined,
    sort_direction: sortConfig?.direction || undefined,
  })

  // Lazy query for export - only fetch when export button is clicked
  const [triggerExport, { data: exportData, isLoading: isExportLoading }] = useLazyExportLogsQuery()

  const logs = data?.logs ?? []
  const total = data?.total ?? 0
  const totalPages = Math.ceil(total / limit)

  // Sorting is now done server-side, so we just use logs directly
  const sortedData = logs


  const handleSort = (column: string) => {
    setSortConfig(prev => {
      if (prev?.key === column) {
        return { key: column, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
      }
      return { key: column, direction: 'asc' }
    })
    // Reset to page 1 when sorting changes
    setPage(1)
  }

  // Export all logs based on current filters
  useEffect(() => {
    if (isExporting && exportData) {
      // CSV header
      const headers = ['SSID', 'BSSID', 'Action', 'Timestamp', 'Details'];
      
      if (exportData.logs.length === 0) {
        alert('No logs found matching the current filters');
        setIsExporting(false);
        return;
      }
      
      // Sorting is done server-side, so we just use exportData.logs directly
      const exportLogs = exportData.logs;
      
      const rows = exportLogs.map(log => [
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

      // Generate filename based on filters
      const filterParts: string[] = [];
      if (debouncedSearchTerm) filterParts.push(`ssid_${debouncedSearchTerm.replace(/[^a-zA-Z0-9]/g, '_')}`);
      if (searchAction) filterParts.push(`action_${searchAction.replace(/[^a-zA-Z0-9]/g, '_')}`);
      if (searchDateFrom) filterParts.push(`from_${searchDateFrom}`);
      if (searchDateTill) filterParts.push(`till_${searchDateTill}`);
      const filterSuffix = filterParts.length > 0 ? `_${filterParts.join('_')}` : '_all';
      const filename = `logs${filterSuffix}_${new Date().toISOString().split('T')[0]}.csv`;

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setIsExporting(false);
    }
  }, [exportData, isExporting, sortConfig, debouncedSearchTerm, searchAction, searchDateFrom, searchDateTill])

  const exportToCSV = async () => {
    setIsExporting(true);
    
    // Fetch all logs based on current filters
    await triggerExport({
      ssid: debouncedSearchTerm.trim() || undefined,
      action: searchAction.trim() || undefined,
      date_from: searchDateFrom.trim() || undefined,
      date_till: searchDateTill.trim() || undefined,
      sort_by: sortConfig?.key || undefined,
      sort_direction: sortConfig?.direction || undefined,
    }).unwrap().catch((error) => {
      console.error('Export failed:', error);
      alert(`Failed to export logs: ${error?.data?.error || error?.message || 'Unknown error'}`);
      setIsExporting(false);
    });
  };
  return (
    <div className="p-3 small-laptop:p-4 normal-laptop:p-5 w-full max-w-full">
      <h1 className="text-lg small-laptop:text-xl font-bold mb-3 small-laptop:mb-4">User Logs</h1>

      <div className="mb-3 small-laptop:mb-4 flex flex-col small-laptop:flex-row gap-2 flex-wrap">
        <input 
          type="text" 
          placeholder="SSID" 
          value={searchTerm} 
          onChange={e => setSearchTerm(e.target.value)}
          className="border px-3 py-2 rounded w-full small-laptop:w-auto flex-1 min-w-[150px] text-sm small-laptop:text-base" 
        />
        <input 
          type="text" 
          placeholder="Action" 
          value={searchAction} 
          onChange={e => setSearchAction(e.target.value)}
          className="border px-3 py-2 rounded w-full small-laptop:w-auto flex-1 min-w-[150px] text-sm small-laptop:text-base" 
        />
        <input 
          type="date" 
          placeholder="Date From" 
          value={searchDateFrom} 
          onChange={e => setSearchDateFrom(e.target.value)}
          className="border px-3 py-2 rounded w-full small-laptop:w-auto text-sm small-laptop:text-base" 
          title="Date From"
        />
        <input 
          type="date" 
          placeholder="Date Till" 
          value={searchDateTill} 
          onChange={e => setSearchDateTill(e.target.value)}
          className="border px-3 py-2 rounded w-full small-laptop:w-auto text-sm small-laptop:text-base" 
          title="Date Till"
        />
        <Button 
          onClick={exportToCSV} 
          type="button" 
          variant="outline"
          disabled={isExporting || isExportLoading}
        >
          {isExporting || isExportLoading ? 'Exporting...' : 'Export All CSV'}
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
        <div className="flex gap-2 mt-3 small-laptop:mt-4 items-center justify-center small-laptop:justify-start text-sm small-laptop:text-base">
          <button 
            disabled={page === 1} 
            onClick={() => setPage(page - 1)}
            className="px-3 py-1 rounded border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
          >
            Prev
          </button>
          <span> {page} of {totalPages}</span>
          <button 
            disabled={page === totalPages} 
            onClick={() => setPage(page + 1)}
            className="px-3 py-1 rounded border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
          >
            Next
          </button>
        </div>
      }
    </div>
  )
}

export default Logs
