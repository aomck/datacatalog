'use client';

import { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem, Chip, IconButton, Tooltip } from '@mui/material';
import { Icon } from '@iconify/react';
import { getFileUrl } from '@/lib/file-url';

interface ApiTestModalProps {
  open: boolean;
  onClose: () => void;
  service: {
    id: string;
    name: string;
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    api: string;
    howTo?: string;
  } | null;
  token: string;
  showHowToVerify?: boolean;
}

export function ApiTestModal({ open, onClose, service, token, showHowToVerify = false }: ApiTestModalProps) {
  const [requestBody, setRequestBody] = useState('{\n  \n}');
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [responseTime, setResponseTime] = useState(0);

  if (!service) return null;

  const method = service.method; // ใช้ method จาก service โดยตรง ไม่ให้แก้ไข

  const handleTestApi = async () => {
    setLoading(true);
    const startTime = Date.now();

    try {
      const options: RequestInit = {
        method: method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Service-Id': service.id,
        },
      };

      if (['POST', 'PUT', 'PATCH'].includes(method)) {
        try {
          JSON.parse(requestBody); // Validate JSON
          options.body = requestBody;
        } catch (e) {
          alert('Request Body ไม่ใช่ JSON ที่ถูกต้อง');
          setLoading(false);
          return;
        }
      }

      const res = await fetch(service.api, options);
      const contentType = res.headers.get('content-type');
      let data;

      if (contentType?.includes('application/json')) {
        data = await res.json();
      } else {
        data = await res.text();
      }

      setResponseTime(Date.now() - startTime);
      setResponse({
        status: res.status,
        statusText: res.statusText,
        headers: Object.fromEntries(res.headers.entries()),
        data,
      });
    } catch (error: any) {
      setResponseTime(Date.now() - startTime);
      setResponse({
        status: 'ERROR',
        statusText: error.message,
        data: null,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadResponse = () => {
    if (!response) return;

    const dataStr = typeof response.data === 'string'
      ? response.data
      : JSON.stringify(response.data, null, 2);

    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${service.name}-response.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyResponse = () => {
    if (!response) return;

    const dataStr = typeof response.data === 'string'
      ? response.data
      : JSON.stringify(response.data, null, 2);

    navigator.clipboard.writeText(dataStr);
    alert('คัดลอกข้อมูลแล้ว');
  };

  const getStatusColor = (status: number | string) => {
    if (status === 'ERROR') return 'error';
    if (typeof status === 'number') {
      if (status >= 200 && status < 300) return 'success';
      if (status >= 300 && status < 400) return 'info';
      if (status >= 400 && status < 500) return 'warning';
      if (status >= 500) return 'error';
    }
    return 'default';
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Icon icon="mdi:api" className="w-6 h-6 text-blue-600" />
              <span>API Testing - {service.name}</span>
            </div>
          </div>
          <IconButton onClick={onClose} size="small">
            <Icon icon="mdi:close" className="w-5 h-5" />
          </IconButton>
        </div>
      </DialogTitle>

      <DialogContent>
        <div className="space-y-4">
          {/* How-to Guide */}
          {service.howTo && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon icon="mdi:file-pdf-box" className="w-5 h-5 text-red-600" />
                  <span className="text-sm font-medium">คู่มือการใช้งาน API</span>
                </div>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<Icon icon="mdi:download" />}
                  onClick={() => window.open(getFileUrl(service.howTo) || service.howTo, '_blank')}
                >
                  ดาวน์โหลด PDF
                </Button>
              </div>
            </div>
          )}

          {/* How to Verify Token */}
          {showHowToVerify && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2 text-purple-900">
                <Icon icon="mdi:shield-check" className="w-5 h-5" />
                วิธีการตรวจสอบ Token และสิทธิ์การเข้าถึง
              </h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="font-medium text-gray-700 mb-2">ขั้นตอนการตรวจสอบ:</p>
                  <ol className="list-decimal list-inside space-y-1 text-gray-600 ml-2">
                    <li>เรียก POST /api/verify-token เพื่อตรวจสอบสิทธิ์</li>
                    <li>ส่ง service_id และ token ใน request body</li>
                    <li>ตรวจสอบ response ว่า authorized: true หรือไม่</li>
                    <li>หากได้รับอนุญาต จึงเรียก API จริง</li>
                  </ol>
                </div>
                <div className="bg-gray-900 text-green-400 p-3 rounded text-xs font-mono overflow-x-auto">
                  <pre>{`// Example: Verify Token Before API Call
const verifyResponse = await fetch('/api/verify-token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    service_id: '${service.id}',
    token: 'YOUR_USER_TOKEN'
  })
});

const verifyData = await verifyResponse.json();

if (verifyData.authorized) {
  // Token is valid, proceed with actual API call
  const apiResponse = await fetch('${service.api}', {
    method: '${method}',
    headers: {
      'Authorization': 'Bearer YOUR_USER_TOKEN',
      'Content-Type': 'application/json',
      'X-Service-Id': '${service.id}'
    }
  });
} else {
  console.error('Unauthorized:', verifyData.message);
}`}</pre>
                </div>
                <div>
                  <p className="font-medium text-gray-700 mb-1">Request Body:</p>
                  <div className="bg-white border border-purple-200 rounded p-2 text-xs font-mono">
                    <pre>{`{
  "service_id": "${service.id}",
  "token": "USER_TOKEN_HERE"
}`}</pre>
                  </div>
                </div>
                <div>
                  <p className="font-medium text-gray-700 mb-1">Response (Success):</p>
                  <div className="bg-white border border-purple-200 rounded p-2 text-xs font-mono">
                    <pre>{`{
  "authorized": true,
  "user_id": "uuid",
  "service_name": "${service.name}",
  "message": "Access granted"
}`}</pre>
                  </div>
                </div>
                <div>
                  <p className="font-medium text-gray-700 mb-1">Response (Failure):</p>
                  <div className="bg-white border border-purple-200 rounded p-2 text-xs font-mono">
                    <pre>{`{
  "authorized": false,
  "message": "Invalid token | Service not found | ..."
}`}</pre>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Example Usage */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2 text-blue-900">
              <Icon icon="mdi:code-tags" className="w-5 h-5" />
              ตัวอย่างการเรียกใช้ API
            </h3>

            <div className="space-y-3">
              {/* cURL Example */}
              <div>
                <p className="text-xs font-semibold text-gray-700 mb-1">cURL:</p>
                <div className="bg-gray-900 text-green-400 p-3 rounded text-xs font-mono overflow-x-auto">
                  <pre>{`curl -X ${method} "${service.api}" \\
  -H "Authorization: Bearer ${token}" \\
  -H "Content-Type: application/json" \\
  -H "X-Service-Id: ${service.id}"${['POST', 'PUT', 'PATCH'].includes(method) ? ` \\
  -d '${requestBody.trim()}'` : ''}`}</pre>
                </div>
              </div>

              {/* JavaScript Fetch Example */}
              <div>
                <p className="text-xs font-semibold text-gray-700 mb-1">JavaScript (Fetch):</p>
                <div className="bg-gray-900 text-green-400 p-3 rounded text-xs font-mono overflow-x-auto">
                  <pre>{`fetch("${service.api}", {
  method: "${method}",
  headers: {
    "Authorization": "Bearer ${token}",
    "Content-Type": "application/json",
    "X-Service-Id": "${service.id}"
  }${['POST', 'PUT', 'PATCH'].includes(method) ? `,
  body: JSON.stringify(${requestBody.trim()})` : ''}
})
  .then(res => res.json())
  .then(data => console.log(data))
  .catch(err => console.error(err));`}</pre>
                </div>
              </div>

              {/* Python Requests Example */}
              <div>
                <p className="text-xs font-semibold text-gray-700 mb-1">Python (Requests):</p>
                <div className="bg-gray-900 text-green-400 p-3 rounded text-xs font-mono overflow-x-auto">
                  <pre>{`import requests

url = "${service.api}"
headers = {
    "Authorization": "Bearer ${token}",
    "Content-Type": "application/json",
    "X-Service-Id": "${service.id}"
}
${['POST', 'PUT', 'PATCH'].includes(method) ? `data = ${requestBody.trim()}

response = requests.${method.toLowerCase()}(url, headers=headers, json=data)` : `response = requests.${method.toLowerCase()}(url, headers=headers)`}
print(response.json())`}</pre>
                </div>
              </div>
            </div>
          </div>

          {/* Request Configuration */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Icon icon="mdi:cog" className="w-5 h-5" />
              Request Configuration
            </h3>

            <div className="space-y-3">
              <TextField
                fullWidth
                label="HTTP Method"
                value={method}
                InputProps={{ readOnly: true }}
                size="small"
              />

              <TextField
                fullWidth
                label="URL"
                value={service.api}
                InputProps={{ readOnly: true }}
                size="small"
              />

              <div className="bg-white rounded p-3 border">
                <p className="text-xs font-semibold text-gray-600 mb-2">Headers</p>
                <div className="space-y-1 text-xs font-mono">
                  <div className="flex">
                    <span className="text-gray-600 w-32">Authorization:</span>
                    <span className="text-blue-600">Bearer {token.substring(0, 20)}...</span>
                  </div>
                  <div className="flex">
                    <span className="text-gray-600 w-32">Content-Type:</span>
                    <span className="text-blue-600">application/json</span>
                  </div>
                  <div className="flex">
                    <span className="text-gray-600 w-32">X-Service-Id:</span>
                    <span className="text-blue-600">{service.id}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Request Body */}
          {['POST', 'PUT', 'PATCH'].includes(method) && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Icon icon="mdi:code-json" className="w-5 h-5" />
                Request Body
              </h3>
              <TextField
                fullWidth
                multiline
                rows={6}
                value={requestBody}
                onChange={(e) => setRequestBody(e.target.value)}
                placeholder='{\n  "key": "value"\n}'
                sx={{
                  '& textarea': {
                    fontFamily: 'monospace',
                    fontSize: '0.875rem',
                  },
                }}
              />
            </div>
          )}

          {/* Send Button */}
          <Button
            fullWidth
            variant="contained"
            size="large"
            startIcon={<Icon icon="mdi:send" />}
            onClick={handleTestApi}
            disabled={loading}
          >
            {loading ? 'กำลังส่ง...' : 'Send Request'}
          </Button>

          {/* Response */}
          {response && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Icon icon="mdi:chart-box" className="w-5 h-5" />
                  Response
                </h3>
                <div className="flex items-center gap-2">
                  <Chip
                    label={`${response.status} ${response.statusText}`}
                    color={getStatusColor(response.status)}
                    size="small"
                  />
                  <Chip
                    label={`${responseTime}ms`}
                    size="small"
                    variant="outlined"
                  />
                </div>
              </div>

              <div className="bg-white rounded border p-3 mb-3">
                <pre className="text-xs font-mono overflow-auto max-h-64">
                  {typeof response.data === 'string'
                    ? response.data
                    : JSON.stringify(response.data, null, 2)}
                </pre>
              </div>

              <div className="flex gap-2">
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<Icon icon="mdi:download" />}
                  onClick={handleDownloadResponse}
                >
                  Download JSON
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<Icon icon="mdi:content-copy" />}
                  onClick={handleCopyResponse}
                >
                  Copy
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>ปิด</Button>
      </DialogActions>
    </Dialog>
  );
}
