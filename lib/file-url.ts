/**
 * Get full file URL with basePath
 * This file can be used in both client and server components
 * @param filePath - File path relative to public (e.g., /uploads/icons/xxx.png)
 */
export function getFileUrl(filePath: string | null | undefined): string | null {
  if (!filePath) return null;

  // Add basePath prefix if configured in next.config
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

  // If filePath already includes basePath, return as is
  if (basePath && filePath.startsWith(basePath)) {
    return filePath;
  }

  // Add basePath prefix
  return basePath + filePath;
}
