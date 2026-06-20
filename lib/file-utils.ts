import fs from 'fs/promises';
import path from 'path';
import { customAlphabet } from 'nanoid';

export interface UploadFileResult {
  success: boolean;
  filePath?: string;
  fileName?: string;
  fileSize?: number;
  error?: string;
}

// Allowed file extensions grouped by upload context
const ALLOWED_EXTENSIONS_IMAGE = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp'];
const ALLOWED_EXTENSIONS_DOCUMENT = ['.pdf', '.doc', '.docx', '.xls', '.xlsx'];

// Dangerous extensions that must always be blocked
const BLOCKED_EXTENSIONS = [
  '.exe', '.bat', '.cmd', '.com', '.msi', '.scr', '.pif',
  '.js', '.jsx', '.ts', '.tsx', '.vbs', '.vbe', '.wsf', '.wsh',
  '.ps1', '.psm1', '.sh', '.bash', '.csh',
  '.zip', '.rar', '.7z', '.tar', '.gz', '.bz2',
  '.php', '.asp', '.aspx', '.jsp', '.cgi', '.py', '.rb', '.pl',
  '.dll', '.sys', '.drv', '.bin',
  '.html', '.htm', '.svg', // SVG is allowed only for icons
  '.jar', '.class', '.war',
];

// Allowed MIME type prefixes/values per context
const ALLOWED_MIME_TYPES_IMAGE = [
  'image/png', 'image/jpeg', 'image/gif', 'image/svg+xml', 'image/webp',
];
const ALLOWED_MIME_TYPES_DOCUMENT = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

type UploadFolder = 'icons' | 'unit-owners' | 'categories' | 'services' | 'requests' | 'approvals' | 'reports' | 'report-designs';

// Icon folders only accept images; document folders accept images + documents
const ICON_FOLDERS: UploadFolder[] = ['icons', 'unit-owners', 'categories'];

function getAllowedExtensions(folder: UploadFolder): string[] {
  if (ICON_FOLDERS.includes(folder)) {
    return ALLOWED_EXTENSIONS_IMAGE;
  }
  return [...ALLOWED_EXTENSIONS_IMAGE.filter(e => e !== '.svg'), ...ALLOWED_EXTENSIONS_DOCUMENT];
}

function getAllowedMimeTypes(folder: UploadFolder): string[] {
  if (ICON_FOLDERS.includes(folder)) {
    return ALLOWED_MIME_TYPES_IMAGE;
  }
  return [
    ...ALLOWED_MIME_TYPES_IMAGE.filter(m => m !== 'image/svg+xml'),
    ...ALLOWED_MIME_TYPES_DOCUMENT,
  ];
}

export function getAcceptString(folder: UploadFolder): string {
  if (ICON_FOLDERS.includes(folder)) {
    return 'image/*';
  }
  return 'image/*,.pdf,.doc,.docx,.xls,.xlsx';
}

export function getAllowedExtensionsList(folder: UploadFolder): string[] {
  return getAllowedExtensions(folder);
}

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB per file

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate a file's type (extension + MIME) and size before upload
 */
export function validateFile(file: File, folder: UploadFolder, maxSizeBytes: number = MAX_FILE_SIZE_BYTES): FileValidationResult {
  // 1. Check file size
  if (file.size > maxSizeBytes) {
    const maxMB = Math.round(maxSizeBytes / (1024 * 1024));
    return { valid: false, error: `ไฟล์ "${file.name}" มีขนาดเกิน ${maxMB}MB` };
  }

  // 2. Check file extension
  const ext = path.extname(file.name).toLowerCase();
  if (!ext) {
    return { valid: false, error: `ไฟล์ "${file.name}" ไม่มีนามสกุลไฟล์` };
  }

  const allowedExts = getAllowedExtensions(folder);
  if (!allowedExts.includes(ext)) {
    return {
      valid: false,
      error: `ไฟล์ "${file.name}" มีนามสกุล ${ext} ที่ไม่รองรับ (รองรับเฉพาะ: ${allowedExts.join(', ')})`,
    };
  }

  // 3. Check MIME type
  const allowedMimes = getAllowedMimeTypes(folder);
  if (file.type && !allowedMimes.includes(file.type) && !file.type.startsWith('image/')) {
    return {
      valid: false,
      error: `ไฟล์ "${file.name}" มีประเภทไฟล์ (${file.type}) ที่ไม่รองรับ`,
    };
  }

  // 4. Double-check against blocked extensions (defense in depth)
  if (BLOCKED_EXTENSIONS.includes(ext) && !allowedExts.includes(ext)) {
    return {
      valid: false,
      error: `ไฟล์ "${file.name}" มีนามสกุล ${ext} ที่ไม่อนุญาตให้อัปโหลด`,
    };
  }

  return { valid: true };
}

/**
 * Ensures upload directory exists
 */
async function ensureUploadDir(dir: string): Promise<void> {
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads', dir);
  try {
    await fs.access(uploadsDir);
  } catch {
    await fs.mkdir(uploadsDir, { recursive: true });
  }
}

// Generate short ID (8 characters, alphanumeric)
const nanoid = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 8);

/**
 * Upload file to /public/uploads/{folder}/
 * @param file - File to upload
 * @param folder - Subfolder in uploads (icons, unit-owners, categories, services, requests, approvals, reports)
 * @returns Upload result with file path relative to public/uploads/
 */
export async function uploadFile(
  file: File,
  folder: UploadFolder
): Promise<UploadFileResult> {
  try {
    // Validate file type and size before upload
    const validation = validateFile(file, folder);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Ensure upload directory exists
    await ensureUploadDir(folder);

    // Generate filename: originalname-shortid.ext
    const ext = path.extname(file.name);
    const basename = path.basename(file.name, ext)
      .replace(/[^a-zA-Z0-9ก-๙_-]/g, '_') // Replace special chars with underscore
      .substring(0, 50); // Limit basename length
    const shortId = nanoid();
    const filename = `${basename}-${shortId}${ext}`;
    const filePath = path.join(process.cwd(), 'public', 'uploads', folder, filename);

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Save file with sync to ensure it's written to disk
    await fs.writeFile(filePath, buffer, { flag: 'w' });

    // Verify file was written successfully
    try {
      await fs.access(filePath);
    } catch (error) {
      throw new Error('File write verification failed');
    }

    return {
      success: true,
      filePath: `/uploads/${folder}/${filename}`,
      fileName: file.name,
      fileSize: buffer.length,
    };
  } catch (error: any) {
    console.error('File upload error:', error);
    return {
      success: false,
      error: error.message || 'Failed to upload file',
    };
  }
}

/**
 * Delete file from /public/uploads/
 * @param filePath - File path relative to public (e.g., /uploads/icons/xxx.png)
 */
export async function deleteFile(filePath: string): Promise<boolean> {
  try {
    const fullPath = path.join(process.cwd(), 'public', filePath);
    await fs.unlink(fullPath);
    return true;
  } catch (error: any) {
    console.error('File delete error:', error);
    return false;
  }
}

/**
 * Get full file URL
 * @param filePath - File path relative to public (e.g., /uploads/icons/xxx.png)
 * @deprecated Use getFileUrl from @/lib/file-url instead (works in both client and server)
 */
export function getFileUrl(filePath: string | null | undefined): string | null {
  if (!filePath) return null;
  return filePath; // Already relative to public, can be used directly in <img src={} />
}

/**
 * Check if file exists
 * @param filePath - File path relative to public (e.g., /uploads/icons/xxx.png)
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    const fullPath = path.join(process.cwd(), 'public', filePath);
    await fs.access(fullPath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get file stats
 * @param filePath - File path relative to public (e.g., /uploads/icons/xxx.png)
 */
export async function getFileStats(filePath: string): Promise<{ size: number; mtime: Date } | null> {
  try {
    const fullPath = path.join(process.cwd(), 'public', filePath);
    const stats = await fs.stat(fullPath);
    return {
      size: stats.size,
      mtime: stats.mtime,
    };
  } catch {
    return null;
  }
}
