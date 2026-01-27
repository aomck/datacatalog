'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
} from '@mui/material';

interface Column {
  id: string;
  label: string;
  minWidth?: number;
  align?: 'left' | 'right' | 'center';
  format?: (value: any, row?: any) => string | React.ReactNode;
}

interface DataTableProps {
  columns: Column[];
  rows: any[];
  page: number;
  rowsPerPage: number;
  totalRows: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange?: (rowsPerPage: number) => void;
}

export function DataTable({
  columns,
  rows,
  page,
  rowsPerPage,
  totalRows,
  onPageChange,
  onRowsPerPageChange,
}: DataTableProps) {
  // Convert from 1-based page (from parent) to 0-based (for MUI)
  const muiPage = page - 1;

  const handleChangePage = (_: unknown, newPage: number) => {
    // Convert from 0-based (MUI) to 1-based (for parent)
    onPageChange(newPage + 1);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (onRowsPerPageChange) {
      onRowsPerPageChange(parseInt(event.target.value, 10));
      onPageChange(1); // Reset to page 1 (1-based)
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        width: '100%',
        overflow: 'hidden',
        border: '1px solid',
        borderColor: 'grey.200',
        borderRadius: 2
      }}
    >
      <TableContainer>
        <Table stickyHeader sx={{ '& .MuiTableCell-root': { borderColor: 'grey.100' } }}>
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column.id}
                  align={column.align}
                  sx={{
                    minWidth: column.minWidth,
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
                <TableCell colSpan={columns.length} align="center" sx={{ py: 8, border: 'none' }}>
                  <div className="text-gray-400 text-sm">ไม่มีข้อมูล</div>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row, index) => (
                <TableRow
                  hover
                  key={index}
                  sx={{
                    '&:hover': { backgroundColor: 'grey.50' },
                    '&:last-child td': { borderBottom: 'none' }
                  }}
                >
                  {columns.map((column) => {
                    const value = row[column.id];
                    return (
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
                        {column.format ? column.format(value, row) : value}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[10, 25, 30, 50, 100]}
        component="div"
        count={totalRows}
        rowsPerPage={rowsPerPage}
        page={muiPage}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        labelRowsPerPage="แถวต่อหน้า:"
        labelDisplayedRows={({ from, to, count }) => `${from}-${to} จาก ${count}`}
        sx={{
          borderTop: '1px solid',
          borderColor: 'grey.200',
          backgroundColor: 'grey.50',
          '.MuiTablePagination-select': {
            fontSize: '0.875rem'
          },
          '.MuiTablePagination-displayedRows': {
            fontSize: '0.875rem',
            color: 'grey.700'
          },
          '.MuiTablePagination-selectLabel': {
            fontSize: '0.875rem',
            color: 'grey.700'
          }
        }}
      />
    </Paper>
  );
}
