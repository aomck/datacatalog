# Public API Documentation

## Base URL
```
https://isoc360.isoc.go.th/datacatalog/api/public
```

---

## 1. Get Unit Owners with Datasets and Services

ดึงข้อมูลหน่วยงานพร้อมชุดข้อมูล (datasets) และบริการ (services) แบบ hierarchy

### Endpoint
```
GET /api/public/unitowners
```

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `search` | string | No | ค้นหาจาก name, short_name ของหน่วยงาน, dataset.name, dataset.detail, service.name, service.detail |
| `unitOwnerId` | string | No | Filter ตาม unit owner id |
| `categoryId` | string | No | Filter ตาม category id |
| `securityLevel` | string | No | Filter ตาม security level (ทั่วไป, ลับ, ลับมาก, ลับที่สุด) |

**หมายเหตุสำคัญ:** API นี้จะแสดงเฉพาะ dataset ที่มี type เป็น "OPEN" เท่านั้น และไม่สามารถเปลี่ยนแปลงได้

### Response Format

```typescript
[
  {
    id: string,
    name: string,
    shortName: string,
    icon: string | null,
    createdAt: string,
    updatedAt: string,
    datasets: [
      {
        id: string,
        name: string,
        detail: string | null,
        securityLevel: string | null,
        metadata: string | null,
        createdAt: string,
        updatedAt: string,
        category: {
          id: string,
          name: string,
          shortName: string,
          icon: string | null
        },
        type: {
          id: string,
          name: string,
          shortName: string
        },
        services: [
          {
            id: string,
            name: string,
            detail: string | null,
            method: string,
            api: string,
            howTo: string | null,
            createdAt: string,
            updatedAt: string
          }
        ]
      }
    ]
  }
]
```

### Examples

#### 1. ดึงข้อมูลหน่วยงานทั้งหมด
```bash
# curl https://isoc360.isoc.go.th/datacatalog/api/public/unitowners
```

#### 2. ค้นหาด้วยคำค้นหา
```bash
curl "https://isoc360.isoc.go.th/datacatalog/api/public/unitowners?search=data"
```

#### 3. Filter ตาม category
```bash
curl "https://isoc360.isoc.go.th/datacatalog/api/public/unitowners?categoryId=123e4567-e89b-12d3-a456-426614174000"
```

#### 4. ค้นหาและ filter พร้อมกัน
```bash
curl "https://isoc360.isoc.go.th/datacatalog/api/public/unitowners?search=education&categoryId=123e4567-e89b-12d3-a456-426614174000"
```

#### 5. Filter ตาม security level
```bash
curl "https://isoc360.isoc.go.th/datacatalog/api/public/unitowners?securityLevel=ทั่วไป"
```

### Response Example

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "กระทรวงศึกษาธิการ",
    "shortName": "MOE",
    "icon": "/icons/moe.png",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-15T00:00:00.000Z",
    "datasets": [
      {
        "id": "660e8400-e29b-41d4-a716-446655440001",
        "name": "ข้อมูลนักเรียน",
        "detail": "ข้อมูลนักเรียนในระดับการศึกษาขั้นพื้นฐาน",
        "securityLevel": "ทั่วไป",
        "metadata": "/metadata/students.pdf",
        "createdAt": "2024-01-02T00:00:00.000Z",
        "updatedAt": "2024-01-15T00:00:00.000Z",
        "category": {
          "id": "770e8400-e29b-41d4-a716-446655440002",
          "name": "การศึกษา",
          "shortName": "EDU",
          "icon": "/icons/education.png"
        },
        "type": {
          "id": "880e8400-e29b-41d4-a716-446655440003",
          "name": "OPEN",
          "shortName": "OPEN"
        },
        "services": [
          {
            "id": "990e8400-e29b-41d4-a716-446655440004",
            "name": "Student Data API",
            "detail": "API สำหรับดึงข้อมูลนักเรียน",
            "method": "GET",
            "api": "/api/students",
            "howTo": "/docs/student-api-guide.pdf",
            "createdAt": "2024-01-03T00:00:00.000Z",
            "updatedAt": "2024-01-15T00:00:00.000Z"
          }
        ]
      }
    ]
  }
]
```

### Notes
- API นี้จะแสดงเฉพาะข้อมูลที่ไม่ถูกลบ (deletedAt = null)
- **API นี้จะแสดงเฉพาะ dataset ที่มี type เป็น "OPEN" เท่านั้น (ไม่สามารถเปลี่ยนแปลงได้)**
- ผลลัพธ์จะเรียงตามชื่อหน่วยงาน (A-Z)
- Datasets จะเรียงตามวันที่สร้างล่าสุด
- Services จะเรียงตามวันที่สร้างล่าสุด
- การค้นหา (search) จะไม่แยกตัวพิมพ์เล็ก-ใหญ่ (case-insensitive)

---

## 2. Get Statistics

ดึงข้อมูลสถิติจำนวนหน่วยงานและชุดข้อมูลที่เปิดให้ใช้งาน

### Endpoint
```
GET /api/public/stats
```

### Query Parameters
ไม่มี

### Response Format

```typescript
{
  unitOwnerCount: number,
  openDatasetCount: number
}
```

### Examples

#### ดึงข้อมูลสถิติ
```bash
curl https://isoc360.isoc.go.th/datacatalog/api/public/stats
```

### Response Example

```json
{
  "unitOwnerCount": 45,
  "openDatasetCount": 123
}
```

### Notes
- `unitOwnerCount`: จำนวนหน่วยงานทั้งหมดที่ไม่ถูกลบ
- `openDatasetCount`: จำนวนชุดข้อมูลที่มี type เป็น "OPEN" และไม่ถูกลบ

---

## Error Responses

### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "message": "Error details..."
}
```

---

## Data Hierarchy

API นี้ส่งข้อมูลในรูปแบบ hierarchy ดังนี้:

```
UnitOwner (หน่วยงาน)
  └── Dataset (ชุดข้อมูล)
        └── Service (บริการ)
```

### UnitOwner
หน่วยงานเจ้าของข้อมูล

### Dataset
ชุดข้อมูลที่หน่วยงานมี โดยแต่ละชุดข้อมูลจะมี:
- Category (หมวดหมู่)
- Type (ประเภท) - **เฉพาะ OPEN เท่านั้น**
- Security Level (ระดับความปลอดภัย)

### Service
บริการที่เกี่ยวข้องกับชุดข้อมูล แต่ละบริการจะระบุ:
- Method (GET, POST, PATCH)
- API endpoint
- วิธีการใช้งาน (How-to document)

---

## Tips

1. **Search across multiple fields**: parameter `search` จะค้นหาในหลายฟิลด์พร้อมกัน
2. **Combine filters**: สามารถใช้หลาย filter พร้อมกัน เช่น `search` + `categoryId`
3. **URL Encoding**: อย่าลืม encode URL parameters เช่น เว้นวรรคใช้ `%20`

### Example with URL Encoding
```bash
curl "https://isoc360.isoc.go.th/datacatalog/api/public/unitowners?search=%E0%B8%81%E0%B8%A3%E0%B8%B0%E0%B8%97%E0%B8%A3%E0%B8%A7%E0%B8%87"
```
