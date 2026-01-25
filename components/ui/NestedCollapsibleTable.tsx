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
import { SecurityLevelBadge } from './SecurityLevelBadge';

interface NestedCollapsibleTableProps {
  rows: any[];
  getRowId: (row: any) => string;
  // Headers
  level1Header: string; // Header for level 1 (e.g., "นโยบายความมั่นคง" or "หน่วยงาน")
  // Level 1: Category/UnitOwner
  level1NameField: string;
  level1ShortNameField?: string;
  level1ChildrenField: string;
  // Level 2: Dataset
  level2NameField: string;
  level2DetailField?: string;
  level2MetadataField?: string;
  level2ChildrenField: string;
  level2Actions?: (row: any) => React.ReactNode;
  // Level 3: Service
  level3NameField: string;
  level3DetailField?: string;
  level3MethodField?: string;
  level3ApiField?: string;
  level3Actions?: (row: any, parentRow: any) => React.ReactNode;
}

export function NestedCollapsibleTable({
  rows,
  getRowId,
  level1Header,
  level1NameField,
  level1ShortNameField,
  level1ChildrenField,
  level2NameField,
  level2DetailField,
  level2MetadataField,
  level2ChildrenField,
  level2Actions,
  level3NameField,
  level3DetailField,
  level3MethodField,
  level3ApiField,
  level3Actions,
}: NestedCollapsibleTableProps) {
  const [openLevel1, setOpenLevel1] = useState<Set<string>>(new Set());
  const [openLevel2, setOpenLevel2] = useState<Set<string>>(new Set());

  const toggleLevel1 = (rowId: string) => {
    setOpenLevel1((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(rowId)) {
        newSet.delete(rowId);
      } else {
        newSet.add(rowId);
      }
      return newSet;
    });
  };

  const toggleLevel2 = (rowId: string) => {
    setOpenLevel2((prev) => {
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
        borderRadius: 2,
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
                px: 3,
              }}
            />
            <TableCell
              sx={{
                fontWeight: 600,
                fontSize: '0.875rem',
                color: 'grey.700',
                backgroundColor: 'grey.50',
                py: 2,
                px: 3,
              }}
            >
              {level1Header}
            </TableCell>
            <TableCell
              sx={{
                fontWeight: 600,
                fontSize: '0.875rem',
                color: 'grey.700',
                backgroundColor: 'grey.50',
                py: 2,
                px: 3,
              }}
            >
              ชื่อย่อ
            </TableCell>
            <TableCell
              align="center"
              sx={{
                fontWeight: 600,
                fontSize: '0.875rem',
                color: 'grey.700',
                backgroundColor: 'grey.50',
                py: 2,
                px: 3,
                width: 100,
              }}
            >
              จำนวนชุดข้อมูล
            </TableCell>
            <TableCell
              align="right"
              sx={{
                fontWeight: 600,
                fontSize: '0.875rem',
                color: 'grey.700',
                backgroundColor: 'grey.50',
                py: 2,
                px: 3,
                width: 150,
              }}
            />
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} align="center" sx={{ py: 8, border: 'none' }}>
                <div className="text-gray-400 text-sm">ไม่มีข้อมูล</div>
              </TableCell>
            </TableRow>
          ) : (
            rows.map((level1Row) => {
              const level1Id = getRowId(level1Row);
              const isLevel1Open = openLevel1.has(level1Id);
              const level2Rows = level1Row[level1ChildrenField] || [];

              return (
                <React.Fragment key={level1Id}>
                  {/* Level 1: Category/UnitOwner */}
                  <TableRow hover sx={{ '&:hover': { backgroundColor: 'grey.50' } }}>
                    <TableCell sx={{ py: 2, px: 3 }}>
                      <IconButton
                        size="small"
                        onClick={() => toggleLevel1(level1Id)}
                        sx={{
                          color: 'grey.600',
                          '&:hover': { backgroundColor: 'grey.100' },
                        }}
                      >
                        <Icon
                          icon={isLevel1Open ? 'mdi:chevron-up' : 'mdi:chevron-down'}
                          className="w-5 h-5"
                        />
                      </IconButton>
                    </TableCell>
                    <TableCell sx={{ py: 2, px: 3, fontSize: '0.875rem', color: 'grey.800' }}>
                      <div className="font-semibold">{level1Row[level1NameField]}</div>
                    </TableCell>
                    <TableCell sx={{ py: 2, px: 3, fontSize: '0.875rem', color: 'grey.600' }}>
                      {level1ShortNameField && level1Row[level1ShortNameField]}
                    </TableCell>
                    <TableCell align="center" sx={{ py: 2, px: 3, fontSize: '0.875rem', color: 'grey.600' }}>
                      {level2Rows.length}
                    </TableCell>
                    <TableCell sx={{ py: 2, px: 3 }} />
                  </TableRow>
                  <TableRow>
                    <TableCell
                      sx={{
                        paddingBottom: 0,
                        paddingTop: 0,
                        borderBottom: isLevel1Open ? '1px solid' : 'none',
                        borderColor: 'grey.100',
                      }}
                      colSpan={4}
                    >
                      <Collapse in={isLevel1Open} timeout="auto" unmountOnExit>
                        <Box sx={{ py: 2, px: 6, backgroundColor: 'grey.25' }}>
                          {level2Rows.length === 0 ? (
                            <div className="text-sm text-gray-500 py-4">ไม่มีชุดข้อมูล</div>
                          ) : (
                            <Table size="small">
                              <TableBody>
                                {level2Rows.map((level2Row: any) => {
                                  const level2Id = getRowId(level2Row);
                                  const isLevel2Open = openLevel2.has(level2Id);
                                  const level3Rows = level2Row[level2ChildrenField] || [];

                                  return (
                                    <React.Fragment key={level2Id}>
                                      {/* Level 2: Dataset */}
                                      <TableRow
                                        hover
                                        sx={{
                                          '&:hover': { backgroundColor: 'white' },
                                        }}
                                      >
                                        <TableCell sx={{ py: 1.5, px: 2, width: 50 }}>
                                          <IconButton
                                            size="small"
                                            onClick={() => toggleLevel2(level2Id)}
                                            sx={{
                                              color: 'grey.600',
                                              '&:hover': { backgroundColor: 'grey.100' },
                                            }}
                                          >
                                            <Icon
                                              icon={
                                                isLevel2Open
                                                  ? 'mdi:chevron-up'
                                                  : 'mdi:chevron-down'
                                              }
                                              className="w-4 h-4"
                                            />
                                          </IconButton>
                                        </TableCell>
                                        <TableCell sx={{ py: 1.5, px: 2, fontSize: '0.875rem' }}>
                                          <div className="flex items-center gap-2">
                                            <span>{level2Row[level2NameField]}</span>
                                            {level2Row.securityLevel && (
                                              <SecurityLevelBadge level={level2Row.securityLevel} size="sm" />
                                            )}
                                          </div>
                                        </TableCell>
                                        <TableCell sx={{ py: 1.5, px: 2, fontSize: '0.875rem' }}>
                                          {level2DetailField && level2Row[level2DetailField]}
                                        </TableCell>
                                        <TableCell
                                          align="center"
                                          sx={{ py: 1.5, px: 2, width: 100 }}
                                        >
                                          {level2MetadataField && level2Row[level2MetadataField] ? (
                                            <IconButton
                                              size="small"
                                              onClick={() =>
                                                window.open(level2Row[level2MetadataField], '_blank')
                                              }
                                            >
                                              <Icon
                                                icon="mdi:file-document"
                                                className="w-5 h-5 text-blue-600"
                                              />
                                            </IconButton>
                                          ) : (
                                            '-'
                                          )}
                                        </TableCell>
                                        <TableCell
                                          align="right"
                                          sx={{ py: 1.5, px: 2, width: 150 }}
                                        >
                                          {level2Actions && level2Actions(level2Row)}
                                        </TableCell>
                                      </TableRow>
                                      <TableRow>
                                        <TableCell
                                          sx={{ paddingBottom: 0, paddingTop: 0, border: 'none' }}
                                          colSpan={5}
                                        >
                                          <Collapse in={isLevel2Open} timeout="auto" unmountOnExit>
                                            <Box sx={{ py: 2, px: 4, backgroundColor: 'grey.50' }}>
                                              <h4 className="font-semibold text-sm mb-2">
                                                บริการข้อมูล
                                              </h4>
                                              {level3Rows.length === 0 ? (
                                                <p className="text-sm text-gray-600">
                                                  ไม่มีบริการข้อมูล
                                                </p>
                                              ) : (
                                                <div className="space-y-2">
                                                  {level3Rows.map((level3Row: any) => (
                                                    <div
                                                      key={level3Row.id}
                                                      className="flex justify-between items-center bg-white p-3 rounded border border-gray-200"
                                                    >
                                                      <div>
                                                        <p className="font-medium text-sm">
                                                          {level3Row[level3NameField]}
                                                        </p>
                                                        {level3DetailField &&
                                                          level3Row[level3DetailField] && (
                                                            <p className="text-xs text-gray-600 mt-0.5">
                                                              {level3Row[level3DetailField]}
                                                            </p>
                                                          )}
                                                        {level3MethodField &&
                                                          level3ApiField && (
                                                            <p className="text-xs text-gray-600 mt-0.5">
                                                              {level3Row[level3MethodField]}{' '}
                                                              {level3Row[level3ApiField]}
                                                            </p>
                                                          )}
                                                      </div>
                                                      {level3Actions && level3Actions(level3Row, level2Row)}
                                                    </div>
                                                  ))}
                                                </div>
                                              )}
                                            </Box>
                                          </Collapse>
                                        </TableCell>
                                      </TableRow>
                                    </React.Fragment>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          )}
                        </Box>
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
