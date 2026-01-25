# Public API - Statistics Summary

API สาธารณะสำหรับดึงข้อมูลสรุปสถิติทั้งหมดของระบบ Data Catalog

## Endpoint

```
GET /api/public/stats
```

## Description

API นี้ให้ข้อมูลสรุปสถิติโดยรวมของระบบ ได้แก่:
- จำนวนหน่วยงานเจ้าของข้อมูล
- จำนวนชุดข้อมูล
- จำนวนบริการ
- จำนวนการเรียกใช้บริการ

**หมายเหตุ:** API นี้เป็น Public API ไม่ต้องใช้ Authentication

## Request

### Method
```
GET
```

### Headers
ไม่ต้องส่ง headers พิเศษ

### Query Parameters

สามารถใช้ query parameters ต่อไปนี้เพื่อกรองข้อมูล (ทุก parameters เป็น optional):

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `unitOwnerId` | string | กรองตามหน่วยงานเจ้าของข้อมูล | `?unitOwnerId=abc-123` |
| `categoryId` | string | กรองตามหมวดหมู่ข้อมูล | `?categoryId=def-456` |
| `datasetType` | string | กรองตามประเภทชุดข้อมูล (shortName หรือ name) | `?datasetType=OPEN` |
| `startDate` | string | กรองการใช้งานบริการตั้งแต่วันที่ (ISO format) | `?startDate=2024-01-01` |
| `endDate` | string | กรองการใช้งานบริการจนถึงวันที่ (ISO format) | `?endDate=2024-12-31` |

**ตัวอย่าง URL พร้อม filters:**
```
GET /api/public/stats?unitOwnerId=abc-123&startDate=2024-01-01&endDate=2024-12-31
```

## Response

### Success Response (200 OK)

```json
{
  "unitOwnerCount": 15,
  "datasetCount": 234,
  "serviceCount": 89,
  "serviceUsageCount": 1523
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `unitOwnerCount` | number | จำนวนหน่วยงานเจ้าของข้อมูลทั้งหมด |
| `datasetCount` | number | จำนวนชุดข้อมูลทั้งหมด |
| `serviceCount` | number | จำนวนบริการทั้งหมด |
| `serviceUsageCount` | number | จำนวนครั้งที่มีการเรียกใช้บริการทั้งหมด |

### Error Response (500 Internal Server Error)

```json
{
  "error": "Internal server error",
  "message": "Error message details"
}
```

## วิธีการเรียกใช้ด้วย Axios

### 1. ติดตั้ง Axios

```bash
npm install axios
```

### 2. Import และเรียกใช้

```javascript
import axios from 'axios';

// ตัวอย่างการเรียกใช้แบบ async/await (ไม่มี filter)
async function getStatistics() {
  try {
    const response = await axios.get('https://your-domain.com/api/public/stats');
    console.log('Statistics:', response.data);

    // เข้าถึงข้อมูล
    console.log('จำนวนหน่วยงาน:', response.data.unitOwnerCount);
    console.log('จำนวนชุดข้อมูล:', response.data.datasetCount);
    console.log('จำนวนบริการ:', response.data.serviceCount);
    console.log('จำนวนการใช้งาน:', response.data.serviceUsageCount);

    return response.data;
  } catch (error) {
    console.error('Error fetching statistics:', error.response?.data || error.message);
    throw error;
  }
}

// เรียกใช้ฟังก์ชัน
getStatistics();
```

### 2.1 การใช้งานพร้อม Query Parameters

```javascript
import axios from 'axios';

// ตัวอย่างการเรียกใช้พร้อม filter
async function getFilteredStatistics(filters) {
  try {
    const response = await axios.get('https://your-domain.com/api/public/stats', {
      params: filters
    });

    console.log('Filtered Statistics:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching statistics:', error.response?.data || error.message);
    throw error;
  }
}

// ตัวอย่างการเรียกใช้
// 1. กรองตามหน่วยงาน
getFilteredStatistics({
  unitOwnerId: 'abc-123'
});

// 2. กรองตามประเภทข้อมูล
getFilteredStatistics({
  datasetType: 'OPEN'
});

// 3. กรองตามช่วงเวลา
getFilteredStatistics({
  startDate: '2024-01-01',
  endDate: '2024-12-31'
});

// 4. กรองหลายเงื่อนไขพร้อมกัน
getFilteredStatistics({
  unitOwnerId: 'abc-123',
  categoryId: 'def-456',
  datasetType: 'OPEN',
  startDate: '2024-01-01',
  endDate: '2024-12-31'
});
```

### 3. ตัวอย่างการใช้งานใน React Component

```javascript
import { useState, useEffect } from 'react';
import axios from 'axios';

function StatisticsComponent() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({});

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await axios.get('https://your-domain.com/api/public/stats', {
          params: filters
        });
        setStats(response.data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchStats();
  }, [filters]); // จะ fetch ใหม่ทุกครั้งที่ filters เปลี่ยน

  if (loading) return <div>กำลังโหลด...</div>;
  if (error) return <div>เกิดข้อผิดพลาด: {error}</div>;

  return (
    <div>
      <h2>สถิติระบบ Data Catalog</h2>

      {/* ตัวอย่าง filter controls */}
      <div>
        <input
          type="text"
          placeholder="Unit Owner ID"
          onChange={(e) => setFilters({...filters, unitOwnerId: e.target.value})}
        />
        <input
          type="date"
          onChange={(e) => setFilters({...filters, startDate: e.target.value})}
        />
        <input
          type="date"
          onChange={(e) => setFilters({...filters, endDate: e.target.value})}
        />
      </div>

      <ul>
        <li>หน่วยงานเจ้าของข้อมูล: {stats.unitOwnerCount}</li>
        <li>ชุดข้อมูล: {stats.datasetCount}</li>
        <li>บริการ: {stats.serviceCount}</li>
        <li>จำนวนการใช้งาน: {stats.serviceUsageCount}</li>
      </ul>
    </div>
  );
}

export default StatisticsComponent;
```

### 4. ตัวอย่างการใช้งานใน Node.js

```javascript
const axios = require('axios');

// สร้าง instance ของ axios พร้อม config
const api = axios.create({
  baseURL: 'https://your-domain.com',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// ฟังก์ชันดึงสถิติ
async function fetchStatistics(filters = {}) {
  try {
    const { data } = await api.get('/api/public/stats', {
      params: filters
    });
    return data;
  } catch (error) {
    if (error.response) {
      // Server ตอบกลับมาพร้อม status code ที่ไม่ใช่ 2xx
      console.error('Response error:', error.response.status, error.response.data);
    } else if (error.request) {
      // Request ถูกส่งไปแล้วแต่ไม่ได้รับ response
      console.error('No response received:', error.request);
    } else {
      // เกิดข้อผิดพลาดในการสร้าง request
      console.error('Error:', error.message);
    }
    throw error;
  }
}

// เรียกใช้แบบไม่มี filter
fetchStatistics()
  .then(stats => {
    console.log('Statistics retrieved successfully:', stats);
  })
  .catch(error => {
    console.error('Failed to fetch statistics');
  });

// เรียกใช้พร้อม filter
fetchStatistics({
  unitOwnerId: 'abc-123',
  startDate: '2024-01-01',
  endDate: '2024-12-31'
})
  .then(stats => {
    console.log('Filtered statistics:', stats);
  })
  .catch(error => {
    console.error('Failed to fetch filtered statistics');
  });
```

## ตัวอย่างการใช้งานขั้นสูง

### การเพิ่ม Retry Logic

```javascript
import axios from 'axios';

async function getStatisticsWithRetry(maxRetries = 3) {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await axios.get('https://your-domain.com/api/public/stats');
      return response.data;
    } catch (error) {
      console.warn(`Attempt ${attempt} failed:`, error.message);
      lastError = error;

      if (attempt < maxRetries) {
        // รอ 1 วินาทีก่อนลองใหม่
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  throw new Error(`Failed after ${maxRetries} attempts: ${lastError.message}`);
}
```

### การใช้งานร่วมกับ Cache

```javascript
import axios from 'axios';

class StatisticsCache {
  constructor(ttl = 60000) { // Cache นาน 1 นาที
    this.cache = null;
    this.timestamp = null;
    this.ttl = ttl;
  }

  async getStatistics() {
    const now = Date.now();

    // ถ้ามี cache และยังไม่หมดอายุ ให้ใช้ cache
    if (this.cache && this.timestamp && (now - this.timestamp < this.ttl)) {
      console.log('Using cached data');
      return this.cache;
    }

    // ถ้าไม่มี cache หรือหมดอายุแล้ว ให้ดึงข้อมูลใหม่
    try {
      const response = await axios.get('https://your-domain.com/api/public/stats');
      this.cache = response.data;
      this.timestamp = now;
      console.log('Fetched fresh data');
      return this.cache;
    } catch (error) {
      console.error('Error fetching statistics:', error);
      // ถ้าเกิด error และมี cache เก่า ให้ใช้ cache เก่าไปก่อน
      if (this.cache) {
        console.warn('Using stale cache due to error');
        return this.cache;
      }
      throw error;
    }
  }

  clearCache() {
    this.cache = null;
    this.timestamp = null;
  }
}

// การใช้งาน
const statsCache = new StatisticsCache(60000); // Cache 1 นาที

async function displayStatistics() {
  const stats = await statsCache.getStatistics();
  console.log(stats);
}
```

## การทำงานของ Filters

### unitOwnerId
- กรองข้อมูลตามหน่วยงานเจ้าของข้อมูลที่ระบุ
- จะนับเฉพาะ datasets, services และ service usage ที่เกี่ยวข้องกับหน่วยงานนี้

### categoryId
- กรองข้อมูลตามหมวดหมู่ที่ระบุ
- จะนับเฉพาะ datasets, services และ service usage ที่อยู่ในหมวดหมู่นี้

### datasetType
- กรองข้อมูลตามประเภทชุดข้อมูล (เช่น OPEN, PRIVATE)
- สามารถใส่ชื่อเต็ม (name) หรือ shortName ก็ได้

### startDate และ endDate
- กรองการใช้งานบริการตามช่วงเวลา
- รูปแบบวันที่: ISO 8601 format (YYYY-MM-DD หรือ YYYY-MM-DDTHH:mm:ss.sssZ)
- ถ้าใช้ร่วมกับ filters อื่น จะกรองทั้งชุดข้อมูลและช่วงเวลา

### การใช้ Filters หลายตัวพร้อมกัน
- สามารถใช้ filter หลายตัวร่วมกันได้
- Filters จะทำงานแบบ AND (เงื่อนไขทั้งหมดต้องตรงกัน)

## หมายเหตุ

- API นี้ไม่ต้องใช้ authentication token
- ข้อมูลที่แสดงเป็นข้อมูลสรุปเท่านั้น ไม่มีรายละเอียดเพิ่มเติม
- นับเฉพาะข้อมูลที่ไม่ถูกลบ (deletedAt = null) สำหรับ unit owners, datasets และ services
- serviceUsageCount จะถูกกรองตามเงื่อนไขที่ระบุ (หน่วยงาน, หมวดหมู่, ประเภทข้อมูล, ช่วงเวลา)
- แนะนำให้ใช้ cache เมื่อเรียกใช้บ่อยๆ เพื่อลดภาระของ server
- วันที่ควรอยู่ในรูปแบบ ISO 8601 (เช่น 2024-01-01 หรือ 2024-01-01T00:00:00.000Z)
