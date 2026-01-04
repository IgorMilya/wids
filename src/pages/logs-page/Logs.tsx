import { useState, useEffect } from 'react'
import { useGetLogsQuery, useLazyExportLogsQuery } from 'store/api'
import { Button, Table } from 'UI'
import {TableLogs} from './table-logs'
import { writeTextFile } from '@tauri-apps/plugin-fs'
import { save } from '@tauri-apps/plugin-dialog'
import { LogEntryType } from 'types'

//TODO:
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

  const [triggerExport, { data: exportData, isLoading: isExportLoading }] = useLazyExportLogsQuery()

  const logs = data?.logs ?? []
  const total = data?.total ?? 0
  const totalPages = Math.ceil(total / limit)

  const sortedData = logs


  const handleSort = (column: string) => {
    setSortConfig(prev => {
      if (prev?.key === column) {
        return { key: column, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
      }
      return { key: column, direction: 'asc' }
    })
    setPage(1)
  }

  useEffect(() => {
    if (isExporting && exportData && !isExportLoading) {
      const handleExport = async () => {
        try {
          const headers = ['SSID', 'BSSID', 'Action', 'Timestamp', 'Details'];

          const exportLogs: LogEntryType[] = Array.isArray(exportData) 
            ? exportData 
            : (exportData && typeof exportData === 'object' && 'logs' in exportData ? (exportData as { logs: LogEntryType[] }).logs : []);
          
          if (!exportLogs || exportLogs.length === 0) {
            console.log('Export data:', exportData);
            console.log('Current view - total:', total, 'logs:', logs.length);
            
            if (total === 0) {
              alert('No logs found matching the current filters');
            } else {
              console.warn('Export returned no logs but current view shows logs.', {
                exportDataIsArray: Array.isArray(exportData),
                exportLogsCount: exportLogs.length,
                viewTotal: total,
                viewLogsCount: logs.length,
                filters: {
                  ssid: debouncedSearchTerm,
                  action: searchAction,
                  date_from: searchDateFrom,
                  date_till: searchDateTill,
                }
              });
            }
            setIsExporting(false);
            return;
          }

          const rows = exportLogs.map((log: LogEntryType) => [
            log.network_ssid,
            log.network_bssid || '-',
            log.action,
            new Date(log.timestamp).toLocaleString(),
            log.details || '-'
          ]);

          const csvContent =
            [headers, ...rows]
              .map(row => row.map((field: string) => `"${String(field).replace(/"/g, '""')}"`).join(','))
              .join('\r\n');

          const filterParts: string[] = [];
          if (debouncedSearchTerm) filterParts.push(`ssid_${debouncedSearchTerm.replace(/[^a-zA-Z0-9]/g, '_')}`);
          if (searchAction) filterParts.push(`action_${searchAction.replace(/[^a-zA-Z0-9]/g, '_')}`);
          if (searchDateFrom) filterParts.push(`from_${searchDateFrom}`);
          if (searchDateTill) filterParts.push(`till_${searchDateTill}`);
          const filterSuffix = filterParts.length > 0 ? `_${filterParts.join('_')}` : '_all';
          const filename = `logs${filterSuffix}_${new Date().toISOString().split('T')[0]}.csv`;

          const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

          if (isTauri) {
            try {
              const filePath = await save({
                defaultPath: filename,
                filters: [{
                  name: 'CSV',
                  extensions: ['csv']
                }]
              });

              if (filePath) {
                await writeTextFile(filePath, csvContent);
                alert('Logs exported successfully!');
              } else {
                setIsExporting(false);
                return;
              }
            } catch (tauriError: any) {
              console.error('Tauri file save error:', tauriError);
              alert(`Failed to save file: ${tauriError?.message || 'Unknown error'}`);
              setIsExporting(false);
              return;
            }
          } else {
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            alert('Logs exported successfully!');
          }

          setIsExporting(false);
        } catch (error: any) {
          console.error('Export error:', error);
          alert(`Failed to export logs: ${error?.message || 'Unknown error'}`);
          setIsExporting(false);
        }
      };

      handleExport();
    }
  }, [exportData, isExporting, isExportLoading, logs, total, sortConfig, debouncedSearchTerm, searchAction, searchDateFrom, searchDateTill])

  const exportToCSV = async () => {
    setIsExporting(true);

    const exportParams: {
      ssid?: string
      action?: string
      date_from?: string
      date_till?: string
      sort_by?: string
      sort_direction?: 'asc' | 'desc'
    } = {};

    // Only include non-empty values
    if (debouncedSearchTerm.trim()) {
      exportParams.ssid = debouncedSearchTerm.trim();
    }
    if (searchAction.trim()) {
      exportParams.action = searchAction.trim();
    }
    if (searchDateFrom.trim()) {
      exportParams.date_from = searchDateFrom.trim();
    }
    if (searchDateTill.trim()) {
      exportParams.date_till = searchDateTill.trim();
    }
    if (sortConfig?.key) {
      exportParams.sort_by = sortConfig.key;
    }
    if (sortConfig?.direction) {
      exportParams.sort_direction = sortConfig.direction;
    }

    console.log('Exporting with params:', exportParams);
    console.log('Current view - total logs:', total, 'visible logs:', logs.length);
    
    await triggerExport(Object.keys(exportParams).length > 0 ? exportParams : undefined).unwrap().catch((error) => {
      console.error('Export failed:', error);
      alert(`Failed to export logs: ${error?.data?.error || error?.message || 'Unknown error'}`);
      setIsExporting(false);
    });
  };
  return (
    <div className="p-3 small-laptop:p-4 normal-laptop:p-5 w-full max-w-full">
      <h1 className="text-lg small-laptop:text-xl font-bold mb-3 small-laptop:mb-4" data-tour="logs-title">User Logs</h1>

      <div className="mb-3 small-laptop:mb-4 flex flex-col small-laptop:flex-row gap-2 flex-wrap" data-tour="logs-search">
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
        <div className="flex gap-2">
          <Button
            onClick={() => {
              setSearchTerm('')
              setSearchAction('')
              setSearchDateFrom('')
              setSearchDateTill('')
              setPage(1)
            }}
            type="button"
            variant="outline"
          >
            Reset Search
          </Button>
          <Button
            onClick={exportToCSV}
            type="button"
            variant="outline"
            disabled={isExporting || isExportLoading}
          >
            {isExporting || isExportLoading ? 'Exporting...' : 'Export All CSV'}
          </Button>
        </div>
      </div>

      {isError && <p className="text-red-500">{String(error)}</p>}
      <Table 
        tableTitle={['SSID', 'BSSID', 'Action', 'Timestamp', 'Details']} 
        notDataFound={!isLoading && !sortedData.length}
        onSort={handleSort} 
        sortConfig={sortConfig}
        isLoading={isLoading}
        columnWidths={['20%', '18%', '15%', '20%', '27%']}
      >
        {sortedData.map((log) => (
          <TableLogs log={log} key={log.id} />
        ))}
      </Table>
      {!!logs.length &&
        <div className="flex gap-2 mt-3 small-laptop:mt-4 items-center justify-center small-laptop:justify-start text-sm small-laptop:text-base">
          <div>
            <Button
              onClick={() => setPage(page - 1)}
              type="button"
              variant="outline"
              disabled={page === 1}
            >
              Prev
            </Button>
          </div>
          <span> {page} of {totalPages}</span>

          <div>
            <Button
              onClick={() => setPage(page + 1)}
              type="button"
              variant="outline"
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      }
    </div>
  )
}

export default Logs
