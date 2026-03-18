# ระบบทะเบียนครุภัณฑ์ (Asset Management System)

ระบบจัดการครุภัณฑ์ครบวงจร พัฒนาด้วย Next.js 15 + App Router

## 🚀 คุณสมบัติ

- ✅ **Authentication** - Login ด้วย JWT
- ✅ **RBAC** - 5 บทบาท: admin, agency_admin, asset_manager, staff, viewer
- ✅ **Asset CRUD** - เพิ่ม แก้ไข ลบ ครุภัณฑ์
- ✅ **Image Upload** - อัปโหลดรูปภาพ (Base64)
- ✅ **QR Code** - สร้างและสแกน QR Code
- ✅ **Depreciation** - คำนวณค่าเสื่อมราคา 2 วิธี (เส้นตรง, ยอดลดลงทวีคูณ)
- ✅ **Maintenance** - จัดการรอบำรุงรักษา
- ✅ **Reports** - 5 ประเภทรายงาน พร้อมส่งออก CSV
- ✅ **Audit Logging** - บันทึกการกระทำทั้งหมด
- ✅ **Dark Theme** - UI สวยงาม รองรับ Responsive

## 📦 การติดตั้ง

```bash
# ติดตั้ง dependencies
npm install

# สร้างฐานข้อมูล
npx prisma migrate dev --name init

# ใส่ข้อมูลเริ่มต้น (admin/admin123)
npx prisma db seed

# รันระบบ
npm run dev
```

เปิดเบราว์เซอร์ไปที่: http://localhost:3000

## 👤 ข้อมูลเข้าสู่ระบบ

- **Username:** admin
- **Password:** admin123

## 📁 โครงสร้างไฟล์

```
src/
├── app/
│   ├── page.tsx              # Login
│   ├── dashboard/page.tsx    # Dashboard
│   ├── assets/
│   │   ├── page.tsx          # รายการครุภัณฑ์
│   │   ├── [id]/page.tsx     # รายละเอียด
│   │   └── add/page.tsx      # เพิ่มใหม่
│   ├── depreciation/page.tsx # ค่าเสื่อมราคา
│   ├── maintenance/page.tsx  # บำรุงรักษา
│   ├── qr-scanner/page.tsx   # สแกน QR
│   ├── reports/page.tsx      # รายงาน
│   └── api/                  # API endpoints
├── components/
│   ├── Sidebar.tsx
│   ├── Header.tsx
│   ├── AssetCard.tsx
│   ├── Modal.tsx
│   └── Toast.tsx
├── lib/
│   ├── prisma.ts
│   ├── auth.ts
│   └── depreciation.ts
└── prisma/
    ├── schema.prisma
    └── seed.ts
```

## 🛠 เทคโนโลยี

- Next.js 15 (App Router)
- TypeScript
- Prisma ORM (SQLite)
- Tailwind CSS
- JWT Authentication
- bcryptjs
- html5-qrcode

## 📝 License

MIT
