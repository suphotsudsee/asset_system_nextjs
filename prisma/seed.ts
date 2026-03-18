import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

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

  // Create sample agencies
  const agency1 = await prisma.agency.upsert({
    where: { code: 'HQ' },
    update: {},
    create: {
      name: 'สำนักงานใหญ่',
      code: 'HQ',
      description: 'สำนักงานใหญ่ กรุงเทพมหานคร',
    },
  });

  const agency2 = await prisma.agency.upsert({
    where: { code: 'BR1' },
    update: {},
    create: {
      name: 'สาขา 1',
      code: 'BR1',
      description: 'สาขาภาคเหนือ',
    },
  });

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
      department: 'IT',
      status: 'active',
      condition: 'good',
      agencyId: agency1.id,
      createdById: admin.id,
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
      department: 'Admin',
      status: 'active',
      condition: 'excellent',
      agencyId: agency1.id,
      createdById: admin.id,
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
      department: 'HR',
      status: 'active',
      condition: 'good',
      agencyId: agency1.id,
      createdById: admin.id,
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
      department: 'Management',
      status: 'active',
      condition: 'excellent',
      agencyId: agency1.id,
      createdById: admin.id,
    },
    {
      assetCode: 'AST-2026-005',
      name: 'เครื่องปรับอากาศ',
      description: 'Daikin Inverter 18000 BTU',
      categoryId: cat1.id,
      serialNumber: 'SN-DK-005',
      purchasePrice: 15000,
      purchaseDate: new Date('2024-04-01'),
      usefulLifeYears: 10,
      salvageValue: 1500,
      depreciationMethod: 'straight_line',
      location: 'ห้องประชุม',
      department: 'Admin',
      status: 'maintenance',
      condition: 'fair',
      agencyId: agency1.id,
      createdById: admin.id,
    },
  ];

  for (const asset of assets) {
    await prisma.asset.create({ data: asset });
    console.log(`✅ Created asset: ${asset.assetCode}`);
  }

  // Create depreciation records
  for (const asset of assets) {
    const yearlyDepreciation = asset.depreciationMethod === 'straight_line'
      ? (asset.purchasePrice - asset.salvageValue) / asset.usefulLifeYears
      : asset.purchasePrice * 0.2; // 20% declining balance

    await prisma.depreciationRecord.create({
      data: {
        assetId: (await prisma.asset.findUnique({ where: { assetCode: asset.assetCode } }))?.id || 1,
        fiscalYear: 2024,
        fiscalPeriod: 'yearly',
        beginningBookValue: asset.purchasePrice,
        depreciationExpense: yearlyDepreciation,
        accumulatedDepreciation: yearlyDepreciation,
        endingBookValue: asset.purchasePrice - yearlyDepreciation,
        depreciationMethod: asset.depreciationMethod,
      },
    });
  }

  // Create maintenance records
  await prisma.maintenanceRecord.create({
    data: {
      assetId: 5,
      maintenanceType: 'preventive',
      title: 'บำรุงรักษาเครื่องปรับอากาศ',
      description: 'ทำความสะอาดฟิลเตอร์และตรวจสอบแก๊ส',
      priority: 'medium',
      scheduledDate: new Date('2026-04-01'),
      dueDate: new Date('2026-04-15'),
      status: 'pending',
      laborCost: 500,
      partsCost: 200,
      totalCost: 700,
      technicianName: 'ช่างสมชาย',
    },
  });

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
