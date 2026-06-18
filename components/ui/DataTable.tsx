import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Play } from 'lucide-react';

export interface Column<T> {
  header: string;
  accessor: keyof T | string;
  cell?: (row: T) => React.ReactNode;
  sortable?: boolean;
  hideOnMobile?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyField?: keyof T | string;
  pagination?: boolean;
  rowsPerPage?: number;
  emptyMessage?: string;
}

export function DataTable<T>({
  columns,
  data,
  keyField = 'id',
  pagination = true,
  rowsPerPage = 10,
  emptyMessage = 'Tidak ada data',
}: DataTableProps<T>) {
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const sortedData = useMemo(() => {
    const sortableItems = [...data];
    if (sortConfig !== null) {
      sortableItems.sort((a: any, b: any) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
        
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [data, sortConfig]);

  const totalPages = Math.ceil(sortedData.length / rowsPerPage);
  const paginatedData = pagination 
    ? sortedData.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)
    : sortedData;

  const handleSort = (accessor: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === accessor && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key: accessor, direction });
  };

  const toggleRow = (id: string) => {
    const newSet = new Set(expandedRows);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedRows(newSet);
  };

  const hasMobileHiddenColumns = columns.some(c => c.hideOnMobile);
  const visibleColumnsCount = columns.filter(c => !c.hideOnMobile).length + (hasMobileHiddenColumns ? 1 : 0);

  return (
    <div className="w-full flex flex-col bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="w-full">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-700 border-b border-gray-200">
            <tr>
              {hasMobileHiddenColumns && (
                <th className="px-3 py-3 md:hidden w-10"></th>
              )}
              {columns.map((col, i) => (
                <th 
                  key={i} 
                  className={`px-4 py-3 font-medium whitespace-nowrap ${col.sortable ? 'cursor-pointer hover:bg-gray-200 select-none transition-colors' : ''} ${col.hideOnMobile ? 'hidden md:table-cell' : 'table-cell'}`}
                  onClick={() => col.sortable && handleSort(col.accessor as string)}
                >
                  <div className="flex items-center gap-1">
                    {col.header}
                    {col.sortable && sortConfig?.key === col.accessor && (
                      sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4 text-green-600" /> : <ChevronDown className="w-4 h-4 text-green-600" />
                    )}
                    {col.sortable && sortConfig?.key !== col.accessor && (
                      <ChevronUp className="w-4 h-4 text-gray-300 opacity-0 group-hover:opacity-100" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={visibleColumnsCount} className="px-4 py-8 text-center text-gray-500">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginatedData.map((row: any, i) => {
                const rowId = String(row[keyField as string] || i);
                const isExpanded = expandedRows.has(rowId);
                
                return (
                  <React.Fragment key={rowId}>
                    <tr className="hover:bg-gray-50/50 transition-colors bg-white">
                      {hasMobileHiddenColumns && (
                        <td className="px-3 py-3 md:hidden w-10 cursor-pointer text-center align-middle" onClick={() => toggleRow(rowId)}>
                          <div className={`inline-block transition-transform duration-200 bg-green-100 text-green-700 rounded-full p-1 ${isExpanded ? 'rotate-90 bg-red-100 text-red-700' : ''}`}>
                            <Play className="w-3 h-3 fill-current" />
                          </div>
                        </td>
                      )}
                      {columns.map((col, j) => (
                        <td key={j} className={`px-4 py-3 text-gray-900 ${col.hideOnMobile ? 'hidden md:table-cell' : 'table-cell'}`}>
                          {col.cell ? col.cell(row) : (row as any)[col.accessor]}
                        </td>
                      ))}
                    </tr>
                    {isExpanded && hasMobileHiddenColumns && (
                      <tr className="md:hidden bg-gray-50/80 border-b border-gray-100">
                        <td colSpan={visibleColumnsCount} className="px-4 py-3">
                          <ul className="space-y-3">
                            {columns.filter(c => c.hideOnMobile).map((col, j) => (
                              <li key={j} className="flex flex-col border-b border-gray-200 pb-2 last:border-0 last:pb-0">
                                <span className="font-semibold text-gray-900 text-xs mb-1 uppercase tracking-wider">{col.header}</span>
                                <div className="text-gray-700">
                                  {col.cell ? col.cell(row) : (row as any)[col.accessor]}
                                </div>
                              </li>
                            ))}
                          </ul>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      
      {pagination && totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-t border-gray-200">
          <div className="text-sm text-gray-600 font-medium">
            Halaman {currentPage} dari {totalPages}
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-md border border-gray-300 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-md border border-gray-300 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
