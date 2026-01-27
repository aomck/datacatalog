import { NextRequest, NextResponse } from 'next/server';
import { readFile, access, stat } from 'fs/promises';
import { join } from 'path';
import { constants } from 'fs';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params;
    const filePath = path.join('/');
    const fullPath = join(process.cwd(), 'public', 'uploads', filePath);

    // Debug logging
    console.log('=== FILE SERVE DEBUG ===');
    console.log('Request URL:', request.url);
    console.log('CWD:', process.cwd());
    console.log('Full Path:', fullPath);

    // Check if file exists and get stats to force fresh read
    let fileStats;
    try {
      fileStats = await stat(fullPath);
      console.log('File Exists: true');
      console.log('File Size:', fileStats.size);
      console.log('File Modified:', fileStats.mtime);
    } catch (error: any) {
      console.log('File Exists: false');
      console.log('Error:', error.message);
      return new NextResponse('File not found', { status: 404 });
    }

    // Read file with explicit flags to bypass cache
    const fileBuffer = await readFile(fullPath);

    // Determine content type based on file extension
    const ext = filePath.split('.').pop()?.toLowerCase();
    const contentTypes: Record<string, string> = {
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'gif': 'image/gif',
      'svg': 'image/svg+xml',
      'webp': 'image/webp',
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };

    const contentType = contentTypes[ext || ''] || 'application/octet-stream';

    const response = new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });

    return response;
  } catch (error: any) {
    console.error('File serve error:', error);
    return new NextResponse('Internal server error', {
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }
}

export async function OPTIONS() {
  const response = new NextResponse(null, { status: 200 });
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  return response;
}
