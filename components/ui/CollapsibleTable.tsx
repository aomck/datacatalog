'use client';

import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Collapse,
  Box,
} from '@mui/material';
import { Icon } from '@iconify/react';

interface CollapsibleTableProps {
  columns: Array<{ id: string; label: string; align?: 'left' | 'right' | 'center'; format?: (row: any) => React.ReactNode }>;
  rows: any[];
  renderCollapse: (row: any) => React.ReactNode;
  getRowId: (row: any) => string;
}

export function CollapsibleTable({
  columns,
  rows,
  renderCollapse,
  getRowId,
}: CollapsibleTableProps) {
  const [openRows, setOpenRows] = useState<Set<string>>(new Set());

  const toggleRow = (rowId: string) => {
    setOpenRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(rowId)) {
        newSet.delete(rowId);
      } else {
        newSet.add(rowId);
      }
      return newSet;
    });
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
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length + 1} align="center" sx={{ py: 8, border: 'none' }}>
                <div className="text-gray-400 text-sm">ไม่มีข้อมูล</div>
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => {
              const rowId = getRowId(row);
              const isOpen = openRows.has(rowId);

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
                        onClick={() => toggleRow(rowId)}
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
                    {columns.map((column) => (
                      <TableCell
                        key={column.id}
                        align={column.align}
                        sx={{
                          py: 2,
                          px: 3,
                          fontSize: '0.875rem',
                          color: 'grey.800'
                        }}
                      >
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
    </TableContainer>
  );
}
