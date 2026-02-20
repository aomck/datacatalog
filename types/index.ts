// User types based on AUTH_PERM_DOC.md
export interface User {
  id: string;
  email: string;
  firstname: string;
  lastname: string;
  tel?: string;
  idCard?: string;
  avatarUrl?: string;
  position?: string;
  status: number;
  sso?: 'local' | 'gmail' | 'ad' | 'rdp';
  roles: Role[];
  units: Unit[];
  activeUnit?: Unit;
  access?: {
    service_access?: { [key: string]: number };
    dataservice_access?: { [key: string]: any };
    confidentiality_access?: { [key: string]: number };
    dashboard_access?: { [key: string]: any };
  };
  created_at?: Date;
  updated_at?: Date;
}

export interface Role {
  id: string;
  name: string;
  nameTh: string;
  description?: string;
}

export interface Unit {
  id: string;
  code: string;
  name: string;
  nameTh: string;
  nameEn?: string;
  status: number;
  org_id?: number;
  icon?: any;
}

export interface RequestBy {
  id: string;
  email: string;
  displayname: string;
  idCard?: string;
  activeUnit?: Unit;
  roles: Role[];
  units: Unit[];
}

// Permission types
export interface ActionPermission {
  create?: boolean;
  view?: boolean;
  update?: boolean;
  delete?: boolean;
  approve?: boolean;
}

export interface DataPermission {
  own?: boolean;
  unit?: boolean;
  all?: boolean;
}

export interface ServicePermissions {
  [routeName: string]: ActionPermission;
}

export interface DataServicePermissions {
  [routeName: string]: DataPermission;
}

export interface PermissionResponse {
  request_by: RequestBy;
  action_permission: {
    [serviceName: string]: ServicePermissions;
  };
  data_permission: {
    [serviceName: string]: DataServicePermissions;
  };
}

// API Response types
export interface ApiResponse<T = any> {
  status: number;
  message: string;
  data: T;
  error: any;
  timestamp: string;
}

export interface LoginResponse {
  token: string;
  refresh_token: string;
}

// ============================================================================
// Data Catalog Types
// ============================================================================

export type ApproveStatus = 'REQUESTED' | 'PENDING' | 'INPROGRESS' | 'APPROVED' | 'DISAPPROVED';
export type ServiceMethod = 'GET' | 'POST' | 'PATCH';
export type SecurityLevel = '0' | '1' | '2' | '3' | '4' | null;

// Unit Owner
export interface UnitOwner {
  id: string;
  name: string;
  shortName: string;
  icon?: string | null;
  createdBy?: string | null;
  createdAt: Date;
  updatedBy?: string | null;
  updatedAt: Date;
  deletedBy?: string | null;
  deletedAt?: Date | null;
  // Report counts by type
  reportCounts?: {
    document: number;
    infographic: number;
    dashboard: number;
  };
}

// Category
export interface Category {
  id: string;
  name: string;
  shortName: string;
  icon?: string | null;
  order?: number;
  createdBy?: string | null;
  createdAt: Date;
  updatedBy?: string | null;
  updatedAt: Date;
  deletedBy?: string | null;
  deletedAt?: Date | null;
  // Report counts by type
  reportCounts?: {
    document: number;
    infographic: number;
    dashboard: number;
  };
}

// Dataset
export interface Dataset {
  id: string;
  name: string;
  code: string;
  detail?: string | null;
  unitOwnerId: string;
  categoryId: string; // Keep for backward compatibility
  typeId?: string | null;
  securityLevel?: SecurityLevel | null;
  metadata?: string | null;
  datadict?: string | null;
  createdBy?: string | null;
  createdAt: Date;
  updatedBy?: string | null;
  updatedAt: Date;
  deletedBy?: string | null;
  deletedAt?: Date | null;
  // Relations
  unitOwner?: UnitOwner;
  category?: Category; // Keep for backward compatibility
  categories?: DatasetCategory[]; // New m:m relation
  services?: Service[];
}

// DatasetCategory - Junction table for Dataset-Category m:m relation
export interface DatasetCategory {
  id: string;
  datasetId: string;
  categoryId: string;
  createdAt: Date;
  // Relations
  dataset?: Dataset;
  category?: Category;
}

// Service
export interface Service {
  id: string;
  name: string;
  detail?: string | null;
  datasetId: string;
  method: ServiceMethod;
  api: string;
  howTo?: string | null;
  createdBy?: string | null;
  createdAt: Date;
  updatedBy?: string | null;
  updatedAt: Date;
  deletedBy?: string | null;
  deletedAt?: Date | null;
  // Relations
  dataset?: Dataset;
}

// Request
export interface Request {
  id: string;
  requestedBy: string;
  name: string;
  unit: string;
  email: string;
  tel: string;
  detail?: string | null;
  createdBy?: string | null;
  createdAt: Date;
  updatedBy?: string | null;
  updatedAt: Date;
  deletedBy?: string | null;
  deletedAt?: Date | null;
  // Relations
  requestDatasets?: RequestDataset[];
  requestServices?: RequestService[];
  requestReports?: RequestReport[];
  requestFiles?: RequestFile[];
}

// RequestDataset
export interface RequestDataset {
  id: string;
  requestId: string;
  datasetId: string;
  approveStatus: ApproveStatus;
  approvedBy?: string | null;
  approvedAt?: Date | null;
  comment?: string | null;
  // Relations
  request?: Request;
  dataset?: Dataset;
}

// RequestService
export interface RequestService {
  id: string;
  requestId: string;
  serviceId: string;
  approveStatus: ApproveStatus;
  approvedBy?: string | null;
  approvedAt?: Date | null;
  comment?: string | null;
  // Relations
  request?: Request;
  service?: Service;
}

// RequestFile
export interface RequestFile {
  id: string;
  requestId: string;
  filePath: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  createdBy?: string | null;
  createdAt: Date;
  updatedBy?: string | null;
  updatedAt: Date;
  deletedBy?: string | null;
  deletedAt?: Date | null;
}

// Pagination
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Cart Item (for localStorage)
export interface CartItem {
  type: 'dataset' | 'service' | 'report';
  id: string;
  name: string;
  datasetId?: string; // For services
  datasetName?: string; // For services
}

// ============================================================================
// Report Types
// ============================================================================

export type ReportTypeName = 'document' | 'infographic' | 'dashboard';

// ReportType
export interface ReportType {
  id: string;
  name: ReportTypeName;
  shortName: string;
  createdBy?: string | null;
  createdAt: Date;
  updatedBy?: string | null;
  updatedAt: Date;
  deletedBy?: string | null;
  deletedAt?: Date | null;
}

// Report
export interface Report {
  id: string;
  name: string;
  detail?: string | null;
  typeId: string;
  url?: string | null;
  categoryId: string; // Keep for backward compatibility
  securityLevel?: SecurityLevel | null;
  createdBy?: string | null;
  createdAt: Date;
  updatedBy?: string | null;
  updatedAt: Date;
  deletedBy?: string | null;
  deletedAt?: Date | null;
  // Relations
  type?: ReportType;
  unitOwners?: ReportUnitOwner[]; // m:m with UnitOwner (involved units)
  category?: Category; // Keep for backward compatibility
  categories?: ReportCategory[]; // m:m with Category
  datasets?: ReportDataset[]; // m:m with Dataset
  files?: ReportFile[];
}

// ReportCategory - Junction table for Report-Category m:m relation
export interface ReportCategory {
  id: string;
  reportId: string;
  categoryId: string;
  createdAt: Date;
  // Relations
  report?: Report;
  category?: Category;
}

// ReportDataset - Junction table for Report-Dataset m:m relation
export interface ReportDataset {
  id: string;
  reportId: string;
  datasetId: string;
  createdAt: Date;
  // Relations
  report?: Report;
  dataset?: Dataset;
}

// ReportUnitOwner - Junction table for Report-UnitOwner m:m relation (involved units)
export interface ReportUnitOwner {
  id: string;
  reportId: string;
  unitOwnerId: string;
  createdAt: Date;
  // Relations
  report?: Report;
  unitOwner?: UnitOwner;
}

// ReportFile
export interface ReportFile {
  id: string;
  reportId: string;
  filePath: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  createdBy?: string | null;
  createdAt: Date;
  updatedBy?: string | null;
  updatedAt: Date;
  deletedBy?: string | null;
  deletedAt?: Date | null;
}

// RequestReport
export interface RequestReport {
  id: string;
  requestId: string;
  reportId?: string | null; // null = ร้องขอรายงานใหม่
  approveStatus: ApproveStatus;
  approvedBy?: string | null;
  approvedAt?: Date | null;
  comment?: string | null;
  // Fields for new report request
  title?: string | null;
  detail?: string | null;
  // Relations
  request?: Request;
  report?: Report;
  designFiles?: RequestReportDesignFile[];
  selectedDatasets?: RequestReportDataset[];
  approvalFiles?: RequestReportApprovalFile[];
  // Helper properties
  requestedDatasetIds?: string[]; // computed from selectedDatasets
}

// RequestReportDesignFile
export interface RequestReportDesignFile {
  id: string;
  requestReportId: string;
  filePath: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  createdBy?: string | null;
  createdAt: Date;
  updatedBy?: string | null;
  updatedAt: Date;
  deletedBy?: string | null;
  deletedAt?: Date | null;
}

// RequestReportDataset
export interface RequestReportDataset {
  id: string;
  requestReportId: string;
  datasetId: string;
  createdAt: Date;
  // Relations
  requestReport?: RequestReport;
  dataset?: Dataset;
}

// RequestReportApprovalFile
export interface RequestReportApprovalFile {
  id: string;
  requestReportId: string;
  filePath: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  createdBy?: string | null;
  createdAt: Date;
  updatedBy?: string | null;
  updatedAt: Date;
  deletedBy?: string | null;
  deletedAt?: Date | null;
}
