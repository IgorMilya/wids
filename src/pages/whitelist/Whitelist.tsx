import { useState, useEffect } from 'react'
import { Table } from 'UI'
import { useGetWhitelistQuery } from 'store/api'
import { tableWhitelistTitle } from './whitelist.utils'
import { TableWhitelist } from './table-whitelist'

const Whitelist = () => {
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
  const { data, isLoading, isError, error } = useGetWhitelistQuery(
    (debouncedSearchTerm || searchDate)
      ? { ssid: debouncedSearchTerm || undefined, date: searchDate || undefined }
      : undefined
  )

  const onToggle = (index: number) => setOpenIndex(openIndex === index ? null : index)

  return (
    <div className="p-3 small-laptop:p-4 normal-laptop:p-5 w-full max-w-full">
      <h1 className="text-lg small-laptop:text-xl font-bold mb-3 small-laptop:mb-4">Whitelist</h1>

      {/* Search Bar */}
      <div className="mb-3 small-laptop:mb-4 flex flex-col small-laptop:flex-row gap-2">
        <input
          type="text"
          placeholder="Search by SSID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border px-3 py-2 rounded w-full small-laptop:max-w-md text-sm small-laptop:text-base"
        />
        <input
          type="date"
          value={searchDate}
          onChange={e => setSearchDate(e.target.value)}
          className="border px-3 py-2 rounded w-full small-laptop:w-auto small-laptop:max-w-xs text-sm small-laptop:text-base"
        />
      </div>

      {isError && <p className="text-red-500">Error: {String(error)}</p>}
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <Table tableTitle={tableWhitelistTitle} notDataFound={!isLoading && data?.length === 0}>
          {data?.map((network, index) => (
            <TableWhitelist
              isShowNetwork={openIndex === index}
              onToggle={() => onToggle(index)}
              key={network.id}
              network={network}
            />
          ))}
        </Table>
      )}
    </div>
  )
}

export default Whitelist
