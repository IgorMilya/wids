import React, { FC } from 'react'

interface TableHeadProps {
  tableTitle: string[];
  onSort?: (column: string) => void;
  sortConfig?: { key: string; direction: 'asc' | 'desc' } | null;
}

const TableHead: FC<TableHeadProps> = ({ tableTitle, onSort, sortConfig }) => {

  const renderSortIndicator = (column: string) => {
    if (!sortConfig || sortConfig.key !== column) return null
    return sortConfig.direction === 'asc' ? ' ▲' : ' ▼'
  }

  return (
    <thead>
    <tr className="bg-white text-sm text-left border-b border-gray-700">
      {tableTitle.map(column => (
        <th
          className="p-3 text-center cursor-pointer select-none"
          key={column}
          onClick={() => onSort?.(column)}
        >
          {column}{renderSortIndicator(column)}
        </th>
      ))}
    </tr>
    </thead>
  )
}

export default TableHead
