# Production Migration Checklist: Dataset Categories M2M

## ⚠️ ข้อควรระวัง
- Migration นี้จะ **HARD DELETE duplicates** (ไม่สามารถกู้คืนได้)
- ต้องมี **Database Backup** ก่อนทำทุกครั้ง
- Downtime: ประมาณ 2-5 นาที (ขึ้นอยู่กับขนาดข้อมูล)

---

## 📋 Pre-Deployment Steps

### ✅ 1. Backup Database
```bash
# PostgreSQL backup
pg_dump -h <host> -U <user> -d <database> -F c -f backup_before_m2m_migration_$(date +%Y%m%d_%H%M%S).dump

# หรือถ้าใช้ managed database (AWS RDS, Azure, etc.)
# ให้สร้าง snapshot ผ่าน console
```

### ✅ 2. ตรวจสอบข้อมูล Production
```sql
-- ตรวจสอบจำนวน datasets
SELECT 
  COUNT(*) as total_datasets, 
  COUNT(DISTINCT name) as unique_names 
FROM datasets 
WHERE "deletedAt" IS NULL;

-- ตรวจสอบ duplicates ที่จะถูกลบ
SELECT name, COUNT(*) as count 
FROM datasets 
WHERE "deletedAt" IS NULL 
GROUP BY name 
HAVING COUNT(*) > 1 
ORDER BY count DESC 
LIMIT 20;

-- Export รายชื่อ duplicates เพื่อเก็บไว้
COPY (
  SELECT d.id, d.name, d."createdAt", c.name as category
  FROM datasets d
  LEFT JOIN categories c ON d.category_id = c.id
  WHERE d."deletedAt" IS NULL
  AND d.name IN (
    SELECT name FROM datasets 
    WHERE "deletedAt" IS NULL 
    GROUP BY name HAVING COUNT(*) > 1
  )
  ORDER BY d.name, d."createdAt"
) TO '/tmp/duplicates_before_migration.csv' WITH CSV HEADER;
```

### ✅ 3. ตรวจสอบว่า Migration Files พร้อม
```bash
# ตรวจสอบว่ามี migration file
ls -la prisma/migrations/20260216000000_add_dataset_categories_m2m/

# ตรวจสอบ Prisma schema
cat prisma/schema.prisma | grep -A 20 "model DatasetCategory"
```

---

## 🚀 Deployment Steps (ลำดับที่ต้องทำ)

### Step 1: หยุดการใช้งานชั่วคราว (Optional แต่แนะนำ)
```bash
# ถ้าใช้ PM2
pm2 stop datacatalog-app

# หรือถ้าใช้ systemd
sudo systemctl stop datacatalog

# หรือถ้าใช้ Docker
docker-compose stop app
```

### Step 2: Pull โค้ดใหม่
```bash
cd /path/to/datacatalog
git pull origin main  # หรือ branch ที่ใช้

# ตรวจสอบว่าไฟล์ที่เปลี่ยนแปลงครบ
git log --oneline -5
git diff HEAD~1 --name-only | grep -E "(prisma|admin|catalog)"
```

### Step 3: Install Dependencies
```bash
npm install
# หรือ
pnpm install
```

### Step 4: Generate Prisma Client
```bash
npx prisma generate
```

### Step 5: รัน Migration (ขั้นตอนสำคัญที่สุด!)
```bash
# Dry-run ก่อน (ถ้า Prisma รองรับ)
npx prisma migrate deploy --preview-feature

# รัน migration จริง
npx prisma migrate deploy

# ถ้าไม่ได้ใช้ prisma migrate deploy สามารถรัน SQL โดยตรง
psql -h <host> -U <user> -d <database> -f prisma/migrations/20260216000000_add_dataset_categories_m2m/migration.sql
```

### Step 6: Verify Migration
```bash
# เช็คว่า table ถูกสร้าง
psql -h <host> -U <user> -d <database> -c "
SELECT COUNT(*) FROM dataset_categories;

-- ตรวจสอบว่ามี datasets ที่มีหลาย categories
SELECT 
  d.name,
  COUNT(dc.id) as category_count
FROM datasets d
JOIN dataset_categories dc ON d.id = dc.dataset_id
WHERE d.\"deletedAt\" IS NULL
GROUP BY d.id, d.name
HAVING COUNT(dc.id) > 1
LIMIT 5;
"
```

### Step 7: Restart Application
```bash
# ถ้าใช้ PM2
pm2 start datacatalog-app
pm2 logs datacatalog-app --lines 50

# หรือถ้าใช้ systemd
sudo systemctl start datacatalog
sudo journalctl -u datacatalog -n 50 -f

# หรือถ้าใช้ Docker
docker-compose up -d app
docker-compose logs -f app --tail 50
```

### Step 8: Smoke Test
```bash
# ทดสอบ API
curl -H "Authorization: Bearer <token>" \
  https://your-domain.com/api/datasets?limit=5

# ตรวจสอบว่า response มี categories array
```

---

## 🧪 Post-Deployment Verification

### ✅ 1. ตรวจสอบข้อมูลหลัง Migration
```sql
-- จำนวน datasets ควรเหลือ unique names เท่านั้น
SELECT 
  COUNT(*) as total_datasets,
  COUNT(DISTINCT name) as unique_names 
FROM datasets 
WHERE "deletedAt" IS NULL;

-- ตรวจสอบว่ามี m2m categories
SELECT COUNT(*) FROM dataset_categories;

-- ดูตัวอย่าง datasets ที่มีหลาย categories
SELECT 
  d.name,
  COUNT(dc.id) as category_count,
  STRING_AGG(c.short_name, ', ') as categories
FROM datasets d
JOIN dataset_categories dc ON d.id = dc.dataset_id
JOIN categories c ON dc.category_id = c.id
WHERE d."deletedAt" IS NULL
GROUP BY d.id, d.name
HAVING COUNT(dc.id) > 1
ORDER BY category_count DESC
LIMIT 10;
```

### ✅ 2. ทดสอบ UI
- [ ] เข้าหน้า Admin → tab ชุดข้อมูล → เห็น categories เป็น chips
- [ ] กดแก้ไข dataset → เห็น multiple select dropdown
- [ ] เลือกหลาย categories → Save → ตรวจสอบว่า save สำเร็จ
- [ ] เข้าหน้า Catalog → filter by category → แสดงผลถูกต้อง

### ✅ 3. ทดสอบ API
```bash
# Test GET /api/datasets
curl -H "Authorization: Bearer <token>" \
  "https://your-domain.com/api/datasets?categoryId=<category-id>&limit=5"

# ตรวจสอบ response structure
# ต้องมีทั้ง category (เดิม) และ categories (ใหม่)
```

---

## 🆘 Rollback Plan (ถ้าเกิดปัญหา)

### Option 1: Restore จาก Backup
```bash
# PostgreSQL
pg_restore -h <host> -U <user> -d <database> -c backup_before_m2m_migration_*.dump

# Managed Database
# ใช้ snapshot restore ผ่าน console
```

### Option 2: Manual Rollback (ถ้า backup ไม่ใช้ได้)
```sql
-- 1. Drop table
DROP TABLE IF EXISTS dataset_categories CASCADE;

-- 2. Revert application code
git revert <commit-hash>
npm install
npx prisma generate

-- 3. Restart application
```

---

## 📊 Monitoring & Logs

### ตรวจสอบ Logs
```bash
# Application logs
tail -f /var/log/datacatalog/app.log

# Database logs
# PostgreSQL
tail -f /var/log/postgresql/postgresql-*.log

# Nginx/Apache access logs
tail -f /var/log/nginx/access.log
```

### Metrics ที่ควรดู
- Response time ของ API `/api/datasets`
- Database query performance
- Error rate ใน application logs
- Memory usage ของ Prisma Client

---

## 📞 Contact & Support

**ถ้าเกิดปัญหา:**
1. อย่าพยายามแก้เอง - Rollback ทันที
2. เก็บ logs ทั้งหมดไว้
3. ติดต่อทีมพัฒนาพร้อม:
   - Database backup file
   - Error logs
   - Steps ที่ทำมา

---

## ✅ Sign-off

- [ ] Database backup สำเร็จ
- [ ] Migration สำเร็จ
- [ ] Verification tests ผ่านทั้งหมด
- [ ] Application ทำงานปกติ
- [ ] ไม่มี errors ใน logs

**Deployed by:** _______________  
**Date/Time:** _______________  
**Verified by:** _______________  
