'use server';

import { uploadFile, deleteFile, getFileUrl, UploadFileResult } from '@/lib/file-utils';

/**
 * Upload icon file
 */
export async function uploadIconFile(formData: FormData) {
  try {
    const file = formData.get('file') as File;
    if (!file) {
      return { success: false, error: 'No file provided' };
    }

    const result = await uploadFile(file, 'icons');
    return result;
  } catch (error: any) {
    console.error('Upload icon error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Upload unit owner icon
 */
export async function uploadUnitOwnerIcon(file: File): Promise<UploadFileResult> {
  try {
    if (!file) {
      return { success: false, error: 'No file provided' };
    }

    const result = await uploadFile(file, 'unit-owners');
    return result;
  } catch (error: any) {
    console.error('Upload unit owner icon error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Upload category icon
 */
export async function uploadCategoryIcon(file: File): Promise<UploadFileResult> {
  try {
    if (!file) {
      return { success: false, error: 'No file provided' };
    }

    const result = await uploadFile(file, 'categories');
    return result;
  } catch (error: any) {
    console.error('Upload category icon error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Upload service how-to file
 */
export async function uploadServiceHowTo(file: File): Promise<UploadFileResult> {
  try {
    if (!file) {
      return { success: false, error: 'No file provided' };
    }

    const result = await uploadFile(file, 'services');
    return result;
  } catch (error: any) {
    console.error('Upload service how-to error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Upload dataset metadata file
 */
export async function uploadDatasetMetadata(file: File): Promise<UploadFileResult> {
  try {
    if (!file) {
      return { success: false, error: 'No file provided' };
    }

    const result = await uploadFile(file, 'services');
    return result;
  } catch (error: any) {
    console.error('Upload dataset metadata error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Upload request file (evidence)
 */
export async function uploadRequestFile(formData: FormData) {
  try {
    const file = formData.get('file') as File;
    if (!file) {
      return { success: false, error: 'No file provided' };
    }

    const result = await uploadFile(file, 'requests');
    return result;
  } catch (error: any) {
    console.error('Upload request file error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Upload multiple request files
 */
export async function uploadRequestFiles(formData: FormData) {
  try {
    const files = formData.getAll('files') as File[];
    if (!files || files.length === 0) {
      return { success: false, error: 'No files provided' };
    }

    const results = await Promise.all(
      files.map((file) => uploadFile(file, 'requests'))
    );

    const successful = results.filter((r) => r.success);
    const failed = results.filter((r) => !r.success);

    if (failed.length > 0) {
      return {
        success: false,
        error: `Failed to upload ${failed.length} file(s)`,
        partial: successful.length > 0,
        uploaded: successful,
      };
    }

    return {
      success: true,
      files: successful.map((r) => ({
        filePath: r.filePath!,
        fileName: r.fileName!,
        fileSize: r.fileSize!,
      })),
    };
  } catch (error: any) {
    console.error('Upload request files error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Upload multiple approval files
 */
export async function uploadApprovalFiles(formData: FormData) {
  try {
    const files = formData.getAll('files') as File[];
    if (!files || files.length === 0) {
      return { success: false, error: 'No files provided' };
    }

    const results = await Promise.all(
      files.map((file) => uploadFile(file, 'approvals'))
    );

    const successful = results.filter((r) => r.success);
    const failed = results.filter((r) => !r.success);

    if (failed.length > 0) {
      return {
        success: false,
        error: `Failed to upload ${failed.length} file(s)`,
        partial: successful.length > 0,
        uploaded: successful,
      };
    }

    return {
      success: true,
      files: successful.map((r) => ({
        filePath: r.filePath!,
        fileName: r.fileName!,
        fileSize: r.fileSize!,
      })),
    };
  } catch (error: any) {
    console.error('Upload approval files error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete file
 */
export async function deleteUploadedFile(filePath: string) {
  try {
    const success = await deleteFile(filePath);
    return { success };
  } catch (error: any) {
    console.error('Delete file error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get file URL (for display)
 */
export async function getUploadedFileUrl(filePath: string | null | undefined) {
  return getFileUrl(filePath);
}
