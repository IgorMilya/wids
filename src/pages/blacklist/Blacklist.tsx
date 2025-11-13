import { useGetBlacklistQuery } from 'store/api'
import { Table } from 'UI'
import { tableBlacklistTitle } from './blacklist.utils'
import { TableBlacklist } from './table-blacklist'
import { useEffect, useState } from 'react'

const Blacklist = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [searchDate, setSearchDate] = useState(''); // e.g. "2025-06-08"
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('') // debounced value
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  // Debounce logic: update debouncedSearchTerm 800ms after user stops typing
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 800)

    // Cleanup timeout if user types again within 500ms
    return () => {
      clearTimeout(handler)
    }
  }, [searchTerm])

  // Use debouncedSearchTerm to trigger API call
  const { data, isLoading, isError, error } = useGetBlacklistQuery(
    (debouncedSearchTerm || searchDate)
      ? { ssid: debouncedSearchTerm || undefined, date: searchDate || undefined }
      : undefined
  )
  const onToggle = (index: number) => setOpenIndex(openIndex === index ? null : index)
  return (
    <div className="p-5 w-full">
      <h1 className="text-xl font-bold mb-4">Blacklist</h1>
      {/* Search Bar */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by SSID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border px-3 py-2 rounded w-full max-w-md"
        />
        <input
          type="date"
          value={searchDate}
          onChange={e => setSearchDate(e.target.value)}
          className="border px-3 py-2 rounded max-w-xs"
        />
      </div>
      {isError && <p className="text-red-500">Error: {String(error)}</p>}
      {isLoading ? <p>Loading...</p> : (
        <Table tableTitle={tableBlacklistTitle} notDataFound={!isLoading && data?.length === 0}>
          {data?.map((network, index) =>
            <TableBlacklist
              isShowNetwork={openIndex === index}
              onToggle={() => onToggle(index)}
              key={network.id}
              network={network}
            />,
          )}
        </Table>
      )
      }

    </div>
  )
}

export default Blacklist
