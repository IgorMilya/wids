import React, { FC } from 'react'
import Skeleton from './Skeleton'

interface TableSkeletonProps {
  columns: number
  rows?: number
}

const TableSkeleton: FC<TableSkeletonProps> = ({ columns, rows = 5 }) => {
  return (
    <tbody>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <tr key={rowIndex} className="border-b border-gray-200">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <td key={colIndex} className="p-3">
              <Skeleton variant="text" width="80%" height={20} />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  )
}

export default TableSkeleton

