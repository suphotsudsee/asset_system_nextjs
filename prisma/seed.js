const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@example.com',
      hashedPassword,
      fullName: 'ผู้ดูแลระบบ',
      role: 'admin',
      permissions: '["all"]',
      isActive: true,
    },
  });

  console.log('✅ Created admin user');

  // Create departments (หน่วยงาน)
  const dept1 = await prisma.department.upsert({
    where: { code: 'IT' },
    update: {},
    create: {
      name: 'เทคโนโลยีสารสนเทศ',
      code: 'IT',
      description: 'กรมเทคโนโลยีสารสนเทศ',
    },
  });

  const dept2 = await prisma.department.upsert({
    where: { code: 'ADMIN' },
    update: {},
    create: {
      name: 'บริหาร',
      code: 'ADMIN',
      description: 'กรมบริหาร',
    },
  });

  const dept3 = await prisma.department.upsert({
    where: { code: 'HR' },
    update: {},
    create: {
      name: 'ทรัพยากรมนุษย์',
      code: 'HR',
      description: 'กรมทรัพยากรมนุษย์',
    },
  });

  const dept4 = await prisma.department.upsert({
    where: { code: 'FIN' },
    update: {},
    create: {
      name: 'การเงิน',
      code: 'FIN',
      description: 'กรมการเงิน',
    },
  });

  console.log('✅ Created departments');

  // Create categories
  const cat1 = await prisma.category.upsert({
    where: { code: 'COMP' },
    update: {},
    create: {
      name: 'คอมพิวเตอร์',
      code: 'COMP',
      description: 'คอมพิวเตอร์และอุปกรณ์',
    },
  });

  const cat2 = await prisma.category.upsert({
    where: { code: 'FURN' },
    update: {},
    create: {
      name: 'เฟอร์นิเจอร์',
      code: 'FURN',
      description: 'เฟอร์นิเจอร์และเครื่องใช้',
    },
  });

  const cat3 = await prisma.category.upsert({
    where: { code: 'VEHI' },
    update: {},
    create: {
      name: 'ยานพาหนะ',
      code: 'VEHI',
      description: 'ยานพาหนะและอุปกรณ์ขนส่ง',
    },
  });

  const cat4 = await prisma.category.upsert({
    where: { code: 'ELEC' },
    update: {},
    create: {
      name: 'เครื่องใช้ไฟฟ้า',
      code: 'ELEC',
      description: 'เครื่องใช้ไฟฟ้า',
    },
  });

  console.log('✅ Created categories');

  // Create sample assets
  const assets = [
    {
      assetCode: 'AST-2026-001',
      name: 'คอมพิวเตอร์ตั้งโต๊ะ Dell',
      description: 'Dell OptiPlex 7090',
      categoryId: cat1.id,
      serialNumber: 'SN-DL-001',
      purchasePrice: 25000,
      purchaseDate: new Date('2024-01-15'),
      usefulLifeYears: 5,
      salvageValue: 2500,
      depreciationMethod: 'straight_line',
      location: 'ห้อง 101',
      departmentId: dept1.id,
      status: 'active',
      condition: 'good',
    },
    {
      assetCode: 'AST-2026-002',
      name: 'เครื่องพิมพ์ HP LaserJet',
      description: 'HP LaserJet Pro M404n',
      categoryId: cat1.id,
      serialNumber: 'SN-HP-002',
      purchasePrice: 8500,
      purchaseDate: new Date('2024-02-20'),
      usefulLifeYears: 5,
      salvageValue: 850,
      depreciationMethod: 'straight_line',
      location: 'ห้อง 102',
      departmentId: dept2.id,
      status: 'active',
      condition: 'excellent',
    },
    {
      assetCode: 'AST-2026-003',
      name: 'โต๊ะทำงานไม้',
      description: 'โต๊ะทำงานขนาด 1.2m',
      categoryId: cat2.id,
      serialNumber: 'SN-FN-003',
      purchasePrice: 3500,
      purchaseDate: new Date('2023-06-10'),
      usefulLifeYears: 10,
      salvageValue: 350,
      depreciationMethod: 'straight_line',
      location: 'ห้อง 201',
      departmentId: dept3.id,
      status: 'active',
      condition: 'good',
    },
    {
      assetCode: 'AST-2026-004',
      name: 'รถยนต์ Toyota Camry',
      description: 'Toyota Camry 2.5G',
      categoryId: cat3.id,
      serialNumber: 'VIN-123456',
      purchasePrice: 950000,
      purchaseDate: new Date('2023-03-01'),
      usefulLifeYears: 8,
      salvageValue: 95000,
      depreciationMethod: 'declining_balance',
      location: 'ลานจอดรถ',
      departmentId: dept2.id,
      status: 'active',
      condition: 'excellent',
    },
    {
      assetCode: 'AST-2026-005',
      name: 'เครื่องปรับอากาศ',
      description: 'Daikin Inverter 18000 BTU',
      categoryId: cat4.id,
      serialNumber: 'SN-DK-005',
      purchasePrice: 15000,
      purchaseDate: new Date('2024-04-01'),
      usefulLifeYears: 10,
      salvageValue: 1500,
      depreciationMethod: 'straight_line',
      location: 'ห้องประชุม',
      departmentId: dept2.id,
      status: 'maintenance',
      condition: 'fair',
    },
  ];

  for (const asset of assets) {
    await prisma.asset.upsert({
      where: { assetCode: asset.assetCode },
      update: {},
      create: asset,
    });
    console.log(`✅ Created/updated asset: ${asset.assetCode}`);
  }

  // Get the first asset for depreciation and maintenance
  const firstAsset = await prisma.asset.findFirst();

  // Create depreciation records
  for (const asset of assets) {
    const yearlyDepreciation = asset.depreciationMethod === 'straight_line'
      ? (asset.purchasePrice - asset.salvageValue) / asset.usefulLifeYears
      : asset.purchasePrice * 0.2;

    const assetRecord = await prisma.asset.findUnique({ where: { assetCode: asset.assetCode } });
    if (assetRecord) {
      await prisma.depreciationRecord.create({
        data: {
          assetId: assetRecord.id,
          fiscalYear: 2024,
          beginningBookValue: asset.purchasePrice,
          depreciationExpense: yearlyDepreciation,
          accumulatedDepreciation: yearlyDepreciation,
          endingBookValue: asset.purchasePrice - yearlyDepreciation,
        },
      });
    }
  }

  console.log('✅ Created depreciation records');

  // Create maintenance records
  if (firstAsset) {
    await prisma.maintenanceRecord.create({
      data: {
        assetId: firstAsset.id,
        maintenanceType: 'preventive',
        title: 'บำรุงรักษาเครื่องปรับอากาศ',
        description: 'ทำความสะอาดฟิลเตอร์และตรวจสอบแก๊ส',
        priority: 'medium',
        scheduledDate: new Date('2026-04-01'),
        status: 'pending',
        laborCost: 700,
        technicianName: 'ช่างสมชาย',
      },
    });
  }

  console.log('✅ Created maintenance records');

  console.log('🌱 Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
