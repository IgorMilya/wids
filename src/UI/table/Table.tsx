import React, { FC, PropsWithChildren } from 'react'
import { TableHead } from './table-head'

interface TableProps extends PropsWithChildren {
  tableTitle: string[];
  notDataFound?: boolean;
  maxH?: string;
  minH?: string;
  onSort?: (column: string) => void;
  sortConfig?: { key: string; direction: 'asc' | 'desc' } | null;
}

const Table: FC<TableProps> = ({ tableTitle, children, notDataFound, maxH, minH, onSort, sortConfig }) => {
  return (
    <div className="p-4 bg-white rounded-xl text-black">
      <div className={`overflow-x-auto ${maxH ?? 'max-h-[550px]'} ${minH ?? 'min-h-[550px]'}`}>
        <table className="min-w-full table-auto border-collapse">
          <TableHead tableTitle={tableTitle} onSort={onSort} sortConfig={sortConfig} />
          <tbody className="text-sm">
          {notDataFound && (
            <tr>
              <td colSpan={6}>
                <div className="flex items-center justify-center h-[352px] text-gray-500">
                  No data
                </div>
              </td>
            </tr>
          )}
          {children}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Table;
