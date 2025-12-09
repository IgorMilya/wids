import React, { FC, PropsWithChildren } from 'react'
import { TableHead } from './table-head'

interface TableProps extends PropsWithChildren {
  tableTitle: string[];
  notDataFound?: boolean;
  maxH?: string;
  minH?: string;
  onSort?: (column: string) => void;
  sortConfig?: { key: string; direction: 'asc' | 'desc' } | null;
  columnWidths?: string[]; // Array of width classes for each column
  isLoading?: boolean;
}

const Table: FC<TableProps> = ({ 
  tableTitle, 
  children, 
  notDataFound, 
  maxH, 
  minH, 
  onSort, 
  sortConfig,
  columnWidths,
  isLoading
}) => {
  return (
    <div className="p-2 small-laptop:p-3 normal-laptop:p-4 bg-white rounded-xl text-black">
      <div className={`overflow-x-auto ${maxH ?? 'max-h-[400px] small-laptop:max-h-[500px] normal-laptop:max-h-[550px]'} ${minH ?? 'min-h-[300px] small-laptop:min-h-[400px] normal-laptop:min-h-[550px]'}`}>
        <table className="min-w-full table-auto border-collapse text-xs small-laptop:text-sm">
          <TableHead 
            tableTitle={tableTitle} 
            onSort={onSort} 
            sortConfig={sortConfig}
            columnWidths={columnWidths}
          />
          <tbody className="text-xs small-laptop:text-sm">
          {isLoading ? (
            <tr>
              <td colSpan={tableTitle.length} className="p-4">
                <div className="flex items-center justify-center">
                  <div className="animate-pulse space-y-2 w-full">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="h-4 bg-gray-200 rounded w-full"></div>
                    ))}
                  </div>
                </div>
              </td>
            </tr>
          ) : notDataFound ? (
            <tr>
              <td colSpan={tableTitle.length}>
                <div className="flex items-center justify-center h-[250px] small-laptop:h-[300px] normal-laptop:h-[352px] text-gray-500">
                  No data
                </div>
              </td>
            </tr>
          ) : (
            children
          )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Table;
