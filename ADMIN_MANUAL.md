# คู่มือผู้ดูแลระบบ - ระบบทะเบียนครุภัณฑ์

## สารบัญ

1. [การจัดการผู้ใช้](#การจัดการผู้ใช้)
2. [RBAC - บทบาทและสิทธิ์](#rbac---บทบาทและสิทธิ์)
3. [Audit Log](#audit-log)
4. [ฐานข้อมูล](#ฐานข้อมูล)
5. [การสำรองข้อมูล](#การสำรองข้อมูล)

---

## การจัดการผู้ใช้

### บทบาทผู้ใช้ (5 ระดับ)

1. **admin** - ผู้ดูแลระบบสูงสุด
   - เข้าถึงทุกฟีเจอร์
   - จัดการผู้ใช้
   - ดู Audit Log

2. **agency_admin** - ผู้ดูแลหน่วยงาน
   - จัดการครุภัณฑ์ในหน่วยงานตนเอง
   - ดูรายงานของหน่วยงาน

3. **asset_manager** - ผู้จัดการครุภัณฑ์
   - เพิ่ม แก้ไข ลบ ครุภัณฑ์
   - สร้างรอบำรุงรักษา

4. **staff** - เจ้าหน้าที่
   - ดูครุภัณฑ์
   - สแกน QR
   - สร้างคำขอบำรุงรักษา

5. **viewer** - ผู้ดู
   - ดูข้อมูลเท่านั้น
   - ไม่สามารถแก้ไขได้

### เพิ่มผู้ใช้

ใช้ Prisma CLI หรือ Admin UI:

```bash
npx prisma studio
```

---

## RBAC - บทบาทและสิทธิ์

สิทธิ์ถูกกำหนดในฟิลด์ `permissions` ของ User model:

```json
["all"]                    // admin
["assets.*", "reports.*"]  // asset_manager
["assets.read"]            // viewer
```

---

## Audit Log

ระบบบันทึกการกระทำทั้งหมดในตาราง `AuditLog`:

- action: create, update, delete, view, login, logout
- entityType: asset, user, maintenance, etc.
- entityId: ID ของสิ่งที่ถูกกระทำ
- oldValues / newValues: JSON ของข้อมูลก่อนและหลัง
- timestamp: เวลาที่กระทำ
- ipAddress: IP ของผู้ใช้
- userAgent: Browser info

### ดู Audit Log

```bash
npx prisma studio
# เปิดตาราง audit_logs
```

---

## ฐานข้อมูล

### Schema

ไฟล์: `prisma/schema.prisma`

### Migration

```bash
# สร้าง migration ใหม่
npx prisma migrate dev --name <description>

# รีเซ็ตฐานข้อมูล
npx prisma migrate reset
```

### Seed Data

```bash
# ใส่ข้อมูลเริ่มต้น
npx prisma db seed
```

ข้อมูลที่ถูกใส่:
- 1 admin user (admin/admin123)
- 2 agencies
- 3 categories
- 5 sample assets
- 1 depreciation record
- 1 maintenance record

---

## การสำรองข้อมูล

### สำรองฐานข้อมูล SQLite

```bash
# คัดลอกไฟล์ฐานข้อมูล
cp prisma/dev.db prisma/dev.backup-$(date +%Y%m%d).db
```

### ส่งออกข้อมูล

```bash
# ส่งออกเป็น CSV
npx prisma studio
# เลือกตาราง > Export > CSV
```

---

## การคำนวณค่าเสื่อมราคา

### 1. วิธีเส้นตรง (Straight Line)

```
ค่าเสื่อมรายปี = (ราคาซื้อ - มูลค่าซาก) / อายุการใช้งาน
```

### 2. วิธียอดลดลงทวีคูณ (Declining Balance)

```
ค่าเสื่อมรายปี = มูลค่าต้นปี × อัตรา (20%)
```

---

## การแก้ปัญหา

### ปัญหา: ไม่สามารถเข้าสู่ระบบ

1. รีเซ็ตรหัสผ่าน:
```bash
npx prisma studio
# แก้ไข hashedPassword ของ admin
```

2. สร้าง admin ใหม่:
```bash
npx prisma db seed
```

### ปัญหา: ฐานข้อมูลเสียหาย

```bash
npx prisma migrate reset
npx prisma db seed
```

---

## การอัปเดตระบบ

```bash
git pull
npm install
npx prisma migrate deploy
npm run build
npm run start
```

---

## ติดต่อสนับสนุน

สำหรับปัญหาทางเทคนิค กรุณาติดต่อทีมพัฒนา
