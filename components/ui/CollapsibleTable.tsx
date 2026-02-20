'use client';

import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  IconButton,
  Collapse,
  Box,
  CircularProgress,
} from '@mui/material';
import { Icon } from '@iconify/react';

interface CollapsibleTableProps {
  columns: Array<{ id: string; label: string; align?: 'left' | 'right' | 'center'; format?: (row: any) => React.ReactNode }>;
  rows: any[];
  renderCollapse: (row: any) => React.ReactNode;
  getRowId: (row: any) => string;
  showUnreadIndicator?: (row: any) => boolean; // Function to determine if row should show red dot
  onRowExpand?: (row: any) => void; // Callback when row is expanded
  totalRows?: number;
  page?: number;
  rowsPerPage?: number;
  onPageChange?: (newPage: number) => void;
  loading?: boolean;
}

export function CollapsibleTable({
  columns,
  rows,
  renderCollapse,
  getRowId,
  showUnreadIndicator,
  onRowExpand,
  totalRows,
  page,
  rowsPerPage,
  onPageChange,
  loading = false,
}: CollapsibleTableProps) {
  const [openRows, setOpenRows] = useState<Set<string>>(new Set());

  // Convert from 1-based page (from parent) to 0-based (for MUI)
  const muiPage = page !== undefined ? page - 1 : 0;

  const handleChangePage = (_: unknown, newPage: number) => {
    // Convert from 0-based (MUI) to 1-based (for parent)
    if (onPageChange) {
      onPageChange(newPage + 1);
    }
  };

  const toggleRow = (row: any, rowId: string) => {
    const isCurrentlyOpen = openRows.has(rowId);
    const isOpening = !isCurrentlyOpen;

    setOpenRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(rowId)) {
        newSet.delete(rowId);
      } else {
        newSet.add(rowId);
      }
      return newSet;
    });

    // Call onRowExpand AFTER setState, when opening a row
    if (onRowExpand && isOpening) {
      // Use setTimeout to ensure it runs after the current render cycle
      setTimeout(() => {
        onRowExpand(row);
      }, 0);
    }
  };

  return (
    <TableContainer
      component={Paper}
      elevation={0}
      sx={{
        border: '1px solid',
        borderColor: 'grey.200',
        borderRadius: 2
      }}
    >
      <Table sx={{ '& .MuiTableCell-root': { borderColor: 'grey.100' } }}>
        <TableHead>
          <TableRow>
            <TableCell
              sx={{
                width: 50,
                fontWeight: 600,
                fontSize: '0.875rem',
                color: 'grey.700',
                backgroundColor: 'grey.50',
                py: 2,
                px: 3
              }}
            />
            {columns.map((column) => (
              <TableCell
                key={column.id}
                align={column.align}
                sx={{
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  color: 'grey.700',
                  backgroundColor: 'grey.50',
                  py: 2,
                  px: 3
                }}
              >
                {column.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={columns.length + 1} align="center" sx={{ py: 8, border: 'none' }}>
                <CircularProgress size={40} />
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length + 1} align="center" sx={{ py: 8, border: 'none' }}>
                <div className="text-gray-400 text-sm">ไม่มีข้อมูล</div>
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => {
              const rowId = getRowId(row);
              const isOpen = openRows.has(rowId);
              const showUnread = showUnreadIndicator ? showUnreadIndicator(row) : false;

              return (
                <React.Fragment key={rowId}>
                  <TableRow
                    key={rowId}
                    hover
                    sx={{
                      '&:hover': { backgroundColor: 'grey.50' }
                    }}
                  >
                    <TableCell sx={{ py: 2, px: 3 }}>
                      <IconButton
                        size="small"
                        onClick={() => toggleRow(row, rowId)}
                        sx={{
                          color: 'grey.600',
                          '&:hover': { backgroundColor: 'grey.100' }
                        }}
                      >
                        <Icon
                          icon={isOpen ? 'mdi:chevron-up' : 'mdi:chevron-down'}
                          className="w-5 h-5"
                        />
                      </IconButton>
                    </TableCell>
                    {columns.map((column, colIndex) => (
                      <TableCell
                        key={column.id}
                        align={column.align}
                        sx={{
                          py: 2,
                          px: 3,
                          fontSize: '0.875rem',
                          color: 'grey.800',
                          position: 'relative'
                        }}
                      >
                        {colIndex === 0 && showUnread && (
                          <span
                            className="absolute left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-red-500 rounded-full"
                            title="มีการอัพเดทใหม่"
                          />
                        )}
                        {column.format ? column.format(row) : row[column.id]}
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell
                      sx={{
                        paddingBottom: 0,
                        paddingTop: 0,
                        borderBottom: isOpen ? '1px solid' : 'none',
                        borderColor: 'grey.100'
                      }}
                      colSpan={columns.length + 1}
                    >
                      <Collapse in={isOpen} timeout="auto" unmountOnExit>
                        <Box sx={{ py: 3, px: 3 }}>{renderCollapse(row)}</Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              );
            })
          )}
        </TableBody>
      </Table>
      {totalRows !== undefined && page !== undefined && rowsPerPage !== undefined && onPageChange && (
        <TablePagination
          component="div"
          count={totalRows}
          page={muiPage}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={[rowsPerPage]}
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} จาก ${count !== -1 ? count : `มากกว่า ${to}`}`}
        />
      )}
    </TableContainer>
  );
}
