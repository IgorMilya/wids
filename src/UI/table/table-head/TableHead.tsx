import React, { FC } from 'react'

interface TableHeadProps {
  tableTitle: string[];
  onSort?: (column: string) => void;
  sortConfig?: { key: string; direction: 'asc' | 'desc' } | null;
  columnWidths?: string[];
}

const TableHead: FC<TableHeadProps> = ({ 
  tableTitle, 
  onSort, 
  sortConfig,
  columnWidths
}) => {

  const renderSortIndicator = (column: string) => {
    if (!sortConfig || sortConfig.key !== column) return null
    return sortConfig.direction === 'asc' ? ' ▲' : ' ▼'
  }

  return (
    <thead>
    <tr className="bg-white text-sm text-left border-b border-gray-700">
      {tableTitle.map((column, index) => (
        <th
          className={`p-3 text-center cursor-pointer select-none hover:bg-gray-50 transition ${columnWidths?.[index] || ''}`}
          key={column}
          onClick={() => onSort?.(column)}
          style={columnWidths?.[index] ? { width: columnWidths[index] } : undefined}
        >
          {column}{renderSortIndicator(column)}
        </th>
      ))}
    </tr>
    </thead>
  )
}

export default TableHead
