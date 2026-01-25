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

export type ApproveStatus = 'REQUESTED' | 'PENDING' | 'APPROVED' | 'DISAPPROVED';
export type ServiceMethod = 'GET' | 'POST' | 'PATCH';
export type SecurityLevel = 'ทั่วไป' | 'ลับ' | 'ลับมาก' | 'ลับที่สุด';

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
}

// Category
export interface Category {
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
}

// Dataset
export interface Dataset {
  id: string;
  name: string;
  detail?: string | null;
  unitOwnerId: string;
  categoryId: string;
  typeId?: string | null;
  securityLevel?: SecurityLevel | null;
  metadata?: string | null;
  createdBy?: string | null;
  createdAt: Date;
  updatedBy?: string | null;
  updatedAt: Date;
  deletedBy?: string | null;
  deletedAt?: Date | null;
  // Relations
  unitOwner?: UnitOwner;
  category?: Category;
  services?: Service[];
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
  type: 'dataset' | 'service';
  id: string;
  name: string;
  datasetId?: string; // For services
  datasetName?: string; // For services
}
