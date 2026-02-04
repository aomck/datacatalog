'use client';

import { useState, useEffect } from 'react';
import { TextField, MenuItem, IconButton, Tooltip } from '@mui/material';
import { Icon } from '@iconify/react';

export interface FilterPanelProps {
  onFilterChange: (filters: FilterState) => void;
  unitOwners?: Array<{ id: string; name: string }>;
  categories?: Array<{ id: string; name: string }>;
  datasetTypes?: Array<{ id: string; name: string }>;
  showUnitOwner?: boolean;
  showCategory?: boolean;
  showSearch?: boolean;
  showStatus?: boolean;
  showDatasetType?: boolean;
  showSecurityLevel?: boolean;
  placeholder?: string;
}

export interface FilterState {
  search: string;
  unitOwnerId: string;
  categoryId: string;
  status: string;
  typeId: string;
  securityLevel: string;
}

export function FilterPanel({
  onFilterChange,
  unitOwners = [],
  categories = [],
  datasetTypes = [],
  showUnitOwner = true,
  showCategory = true,
  showSearch = true,
  showStatus = false,
  showDatasetType = false,
  showSecurityLevel = false,
  placeholder = 'ค้นหาชื่อชุดข้อมูล, บริการ...',
}: FilterPanelProps) {
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    unitOwnerId: '',
    categoryId: '',
    status: '',
    typeId: '',
    securityLevel: '',
  });

  useEffect(() => {
    onFilterChange(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const handleReset = () => {
    setFilters({
      search: '',
      unitOwnerId: '',
      categoryId: '',
      status: '',
      typeId: '',
      securityLevel: '',
    });
  };

  const hasActiveFilters = filters.search || filters.unitOwnerId || filters.categoryId || filters.status || filters.typeId || filters.securityLevel;

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
      <div className="flex items-center gap-3">
        {showSearch && (
          <TextField
            size="small"
            placeholder={placeholder}
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            sx={{ flex: 1, minWidth: 200 }}
            InputProps={{
              startAdornment: <Icon icon="mdi:magnify" className="w-5 h-5 text-gray-400 mr-2" />,
            }}
          />
        )}

        {showUnitOwner && (
          <TextField
            select
            size="small"
            label="หน่วยงาน"
            value={filters.unitOwnerId}
            onChange={(e) => setFilters({ ...filters, unitOwnerId: e.target.value })}
            sx={{ minWidth: 200 }}
          >
            <MenuItem value="">ทั้งหมด</MenuItem>
            {unitOwners.map((u) => (
              <MenuItem key={u.id} value={u.id}>
                {u.name}
              </MenuItem>
            ))}
          </TextField>
        )}

        {showCategory && (
          <TextField
            select
            size="small"
            label="นโยบายและแผนความมั่นคง"
            value={filters.categoryId}
            onChange={(e) => setFilters({ ...filters, categoryId: e.target.value })}
            sx={{ minWidth: 200 }}
          >
            <MenuItem value="">ทั้งหมด</MenuItem>
            {categories.map((c) => (
              <MenuItem key={c.id} value={c.id}>
                {c.name}
              </MenuItem>
            ))}
          </TextField>
        )}

        {showStatus && (
          <TextField
            select
            size="small"
            label="สถานะ"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="">ทั้งหมด</MenuItem>
            <MenuItem value="REQUESTED">รอดำเนินการ</MenuItem>
            <MenuItem value="PENDING">กำลังพิจารณา</MenuItem>
            <MenuItem value="APPROVED">อนุมัติแล้ว</MenuItem>
            <MenuItem value="DISAPPROVED">ไม่อนุมัติ</MenuItem>
          </TextField>
        )}

        {showDatasetType && (
          <TextField
            select
            size="small"
            label="ประเภทข้อมูล"
            value={filters.typeId}
            onChange={(e) => setFilters({ ...filters, typeId: e.target.value })}
            sx={{ minWidth: 180 }}
          >
            <MenuItem value="">ทั้งหมด</MenuItem>
            {datasetTypes.map((t) => (
              <MenuItem key={t.id} value={t.id}>
                {t.name}
              </MenuItem>
            ))}
          </TextField>
        )}

        {showSecurityLevel && (
          <TextField
            select
            size="small"
            label="ชั้นความลับ"
            value={filters.securityLevel}
            onChange={(e) => setFilters({ ...filters, securityLevel: e.target.value })}
            sx={{ minWidth: 180 }}
          >
            <MenuItem value="">ทั้งหมด</MenuItem>
            <MenuItem value="0">ไม่มีชั้นความลับ</MenuItem>
            <MenuItem value="1">ทั่วไป</MenuItem>
            <MenuItem value="2">ลับ</MenuItem>
            <MenuItem value="3">ลับมาก</MenuItem>
            <MenuItem value="4">ลับที่สุด</MenuItem>
          </TextField>
        )}

        {hasActiveFilters && (
          <Tooltip title="ล้างตัวกรอง">
            <IconButton onClick={handleReset} size="small" color="warning">
              <Icon icon="mdi:filter-off" className="w-5 h-5" />
            </IconButton>
          </Tooltip>
        )}
      </div>
    </div>
  );
}
