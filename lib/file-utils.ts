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
 * @param folder - Subfolder in uploads (icons, unit-owners, categories, services, requests, approvals)
 * @returns Upload result with file path relative to public/uploads/
 */
export async function uploadFile(
  file: File,
  folder: 'icons' | 'unit-owners' | 'categories' | 'services' | 'requests' | 'approvals'
): Promise<UploadFileResult> {
  try {
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

    // Save file
    await fs.writeFile(filePath, buffer);

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
