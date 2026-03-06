import React from 'react';
import { Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { AdminPagination } from '@/components/admin/AdminPagination';

// ============================================================
// DataTable — Reusable admin table organism
// Composes: Search + Filter slots + Table + Loading + Empty + Pagination
// Eliminates duplicated table patterns across admin pages
// ============================================================

export interface DataTableColumn<T> {
  key: string;
  header: string;
  className?: string;
  render: (item: T) => React.ReactNode;
}

interface DataTableProps<T> {
  /** Column definitions */
  columns: DataTableColumn<T>[];
  /** Paginated data to display */
  data: T[];
  /** Total unpaginated items count */
  totalItems: number;
  /** Loading state */
  isLoading?: boolean;
  /** Unique key extractor */
  getRowKey: (item: T) => string;

  // Search
  search?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;

  // Pagination
  currentPage?: number;
  totalPages?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;

  // Slots for custom filters (rendered next to search)
  filterSlot?: React.ReactNode;

  // Empty state
  emptyMessage?: string;
}

export function DataTable<T>({
  columns,
  data,
  totalItems,
  isLoading = false,
  getRowKey,
  search,
  onSearchChange,
  searchPlaceholder = 'Buscar...',
  currentPage = 1,
  totalPages = 1,
  pageSize = 10,
  onPageChange,
  onPageSizeChange,
  filterSlot,
  emptyMessage = 'Nenhum registro encontrado',
}: DataTableProps<T>) {
  return (
    <div className="space-y-4">
      {/* Search + Filters Bar */}
      {(onSearchChange || filterSlot) && (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              {onSearchChange && (
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={searchPlaceholder}
                    value={search || ''}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="pl-9"
                  />
                </div>
              )}
              {filterSlot}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map(col => (
                  <TableHead key={col.key} className={col.className}>
                    {col.header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={`skeleton-${i}`}>
                    {columns.map((col, j) => (
                      <TableCell key={`skeleton-${i}-${j}`}>
                        <Skeleton className="h-6 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : data.length > 0 ? (
                data.map((item) => (
                  <TableRow key={getRowKey(item)}>
                    {columns.map(col => (
                      <TableCell key={col.key} className={col.className}>
                        {col.render(item)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="text-center py-8 text-muted-foreground">
                    {emptyMessage}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {totalItems > 0 && onPageChange && onPageSizeChange && (
            <AdminPagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={onPageChange}
              onPageSizeChange={onPageSizeChange}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
