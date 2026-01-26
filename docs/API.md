# Data Catalog API Documentation

## Authentication

ทุก API endpoint ต้องแนบ header:
- `Authorization: Bearer <token>`

Token จะถูกตรวจสอบกับ Core API ผ่าน `/auth/me`

---

## 1. GET /api/datasets

ดึงรายการ datasets ที่เปิดใช้งานทั้งหมด

### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `unitOwnerId` | string | No | Filter by unit owner ID |
| `categoryId` | string | No | Filter by category ID |
| `typeId` | string | No | Filter by dataset type ID |
| `securityLevel` | 0\|1\|2\|3\|4 | No | Filter by security level |
| `page` | number | No | Page number (default: 1) |
| `limit` | number | No | Items per page (default: 10, max: 100) |

### Example Request
```bash
curl -X GET "https://isoc360.isoc.go.th/datacatalog/api/datasets?securityLevel=0&page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Response
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Dataset Name",
      "detail": "Dataset description",
      "unitOwnerId": "uuid",
      "categoryId": "uuid",
      "typeId": "uuid",
      "securityLevel": "0",
      "metadata": null,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "unitOwner": {
        "id": "uuid",
        "name": "Unit Name",
        "shortName": "UN"
      },
      "category": {
        "id": "uuid",
        "name": "Category Name",
        "shortName": "CAT"
      },
      "type": {
        "id": "uuid",
        "name": "Type Name",
        "shortName": "TYPE"
      },
      "services": []
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

---

## 2. GET /api/statistics

ดึงสถิติรวมของระบบ

### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `startDate` | ISO date | No | Start date for access logs (e.g., 2024-01-01) |
| `endDate` | ISO date | No | End date for access logs (e.g., 2024-12-31) |

### Example Request
```bash
curl -X GET "https://isoc360.isoc.go.th/datacatalog/api/statistics?startDate=2024-01-01&endDate=2024-12-31" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Response
```json
{
  "success": true,
  "data": {
    "catalogsByType": [
      {
        "typeId": "uuid",
        "typeName": "API",
        "typeShortName": "API",
        "count": 50
      }
    ],
    "datasetsBySecurityLevel": [
      {
        "securityLevel": "0",
        "securityLevelName": "ทั่วไป",
        "count": 30
      },
      {
        "securityLevel": "1",
        "securityLevelName": "ปกปิด",
        "count": 20
      }
    ],
    "totalDatasets": 100,
    "totalServices": 150,
    "accessCount": 5000,
    "dateRange": {
      "startDate": "2024-01-01",
      "endDate": "2024-12-31"
    }
  }
}
```

---

## Security Levels

| Level | ชื่อภาษาไทย |
|-------|------------|
0 = ไม่มีชั้นความลับ
1 = ทั่วไป
2 = ลับ
3 = ลับมาก
4 = ลับที่สุด

---

## Error Response

```json
{
  "success": false,
  "message": "Error message"
}
```

### HTTP Status Codes
- `400` - Bad Request (missing required headers/parameters)
- `401` - Unauthorized (invalid token)
- `500` - Internal Server Error
