import React, { useState, useMemo } from 'react';
import { Card, SearchInput, Button, Icon } from '../common';
import './DataTable.css';

export interface Column<T> {
    key: keyof T | string;
    header: string;
    width?: string;
    sortable?: boolean;
    render?: (value: unknown, row: T, index: number) => React.ReactNode;
}

export interface DataTableProps<T> {
    title: string;
    columns: Column<T>[];
    data: T[];
    idKey?: keyof T;
    searchable?: boolean;
    searchPlaceholder?: string;
    pageSize?: number;
    pageSizeOptions?: number[];
    showRefresh?: boolean;
    onRefresh?: () => void;
    actions?: React.ReactNode;
    emptyMessage?: string;
    loading?: boolean;
}

function DataTable<T extends Record<string, unknown>>({
    title,
    columns,
    data,
    idKey = 'id' as keyof T,
    searchable = true,
    searchPlaceholder = 'Search...',
    pageSize: initialPageSize = 10,
    pageSizeOptions = [10, 25, 50, 100],
    showRefresh = true,
    onRefresh,
    actions,
    emptyMessage = 'No data available',
    loading = false,
}: DataTableProps<T>) {
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(initialPageSize);
    const [sortKey, setSortKey] = useState<string | null>(null);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

    // Filter data based on search
    const filteredData = useMemo(() => {
        if (!searchQuery) return data;

        const query = searchQuery.toLowerCase();
        return data.filter((row) =>
            Object.values(row).some((value) =>
                String(value).toLowerCase().includes(query)
            )
        );
    }, [data, searchQuery]);

    // Sort data
    const sortedData = useMemo(() => {
        if (!sortKey) return filteredData;

        return [...filteredData].sort((a, b) => {
            const aValue = a[sortKey as keyof T];
            const bValue = b[sortKey as keyof T];

            if (aValue === bValue) return 0;

            const comparison = aValue < bValue ? -1 : 1;
            return sortDirection === 'asc' ? comparison : -comparison;
        });
    }, [filteredData, sortKey, sortDirection]);

    // Paginate data
    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * pageSize;
        return sortedData.slice(startIndex, startIndex + pageSize);
    }, [sortedData, currentPage, pageSize]);

    const totalPages = Math.ceil(sortedData.length / pageSize);
    const startItem = (currentPage - 1) * pageSize + 1;
    const endItem = Math.min(currentPage * pageSize, sortedData.length);

    const handleSort = (key: string) => {
        if (sortKey === key) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDirection('asc');
        }
    };

    const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setPageSize(Number(e.target.value));
        setCurrentPage(1);
    };

    const getValue = (row: T, key: string): unknown => {
        const keys = key.split('.');
        let value: unknown = row;
        for (const k of keys) {
            value = (value as Record<string, unknown>)?.[k];
        }
        return value;
    };

    return (
        <Card className="data-table-card">
            <Card.Header actions={actions}>
                {title}
            </Card.Header>

            <Card.Body noPadding>
                {/* Toolbar */}
                <div className="data-table-toolbar">
                    <div className="data-table-toolbar-left">
                        <span className="data-table-count-badge">
                            {sortedData.length}
                        </span>
                    </div>

                    <div className="data-table-toolbar-right">
                        {searchable && (
                            <SearchInput
                                placeholder={searchPlaceholder}
                                value={searchQuery}
                                onChange={setSearchQuery}
                            />
                        )}

                        {showRefresh && (
                            <Button
                                variant="secondary"
                                leftIcon="refresh"
                                onClick={onRefresh}
                                className={loading ? 'data-table-refresh-loading' : ''}
                            />
                        )}

                        <div className="data-table-page-size">
                            <select
                                value={pageSize}
                                onChange={handlePageSizeChange}
                                className="data-table-page-size-select"
                            >
                                {pageSizeOptions.map((size) => (
                                    <option key={size} value={size}>
                                        {size}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="data-table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                {columns.map((column) => (
                                    <th
                                        key={String(column.key)}
                                        style={{ width: column.width }}
                                        className={column.sortable ? 'data-table-sortable' : ''}
                                        onClick={() => column.sortable && handleSort(String(column.key))}
                                    >
                                        <div className="data-table-th-content">
                                            <span>{column.header}</span>
                                            {column.sortable && (
                                                <span className="data-table-sort-icon">
                                                    {sortKey === column.key ? (
                                                        <Icon
                                                            name={sortDirection === 'asc' ? 'chevron-up' : 'chevron-down'}
                                                            size={14}
                                                        />
                                                    ) : (
                                                        <Icon name="chevron-down" size={14} />
                                                    )}
                                                </span>
                                            )}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={columns.length} className="data-table-loading">
                                        <div className="data-table-loading-spinner">
                                            <Icon name="refresh" size={24} className="animate-spin" />
                                            <span>Loading...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : paginatedData.length === 0 ? (
                                <tr>
                                    <td colSpan={columns.length} className="data-table-empty">
                                        {emptyMessage}
                                    </td>
                                </tr>
                            ) : (
                                paginatedData.map((row, rowIndex) => (
                                    <tr key={String(row[idKey] || rowIndex)}>
                                        {columns.map((column) => {
                                            const value = getValue(row, String(column.key));
                                            return (
                                                <td key={String(column.key)}>
                                                    {column.render
                                                        ? column.render(value, row, rowIndex)
                                                        : String(value ?? '')}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {!loading && sortedData.length > 0 && (
                    <div className="data-table-pagination">
                        <div className="data-table-pagination-info">
                            Showing {startItem} to {endItem} of {sortedData.length} entries
                        </div>

                        <div className="data-table-pagination-controls">
                            <button
                                className="data-table-pagination-btn"
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(1)}
                            >
                                <Icon name="chevron-left" size={14} />
                                <Icon name="chevron-left" size={14} />
                            </button>
                            <button
                                className="data-table-pagination-btn"
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(currentPage - 1)}
                            >
                                <Icon name="chevron-left" size={14} />
                            </button>

                            <span className="data-table-pagination-pages">
                                Page {currentPage} of {totalPages}
                            </span>

                            <button
                                className="data-table-pagination-btn"
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage(currentPage + 1)}
                            >
                                <Icon name="chevron-right" size={14} />
                            </button>
                            <button
                                className="data-table-pagination-btn"
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage(totalPages)}
                            >
                                <Icon name="chevron-right" size={14} />
                                <Icon name="chevron-right" size={14} />
                            </button>
                        </div>
                    </div>
                )}
            </Card.Body>
        </Card>
    );
}

export default DataTable;
