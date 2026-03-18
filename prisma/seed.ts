import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const hashedPassword = await bcrypt.hash('admin123', 12);

  await prisma.user.upsert({
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

  const deptIt = await prisma.department.upsert({
    where: { code: 'IT' },
    update: {},
    create: {
      name: 'เทคโนโลยีสารสนเทศ',
      code: 'IT',
      description: 'งานดูแลระบบและอุปกรณ์คอมพิวเตอร์',
    },
  });

  const deptAdmin = await prisma.department.upsert({
    where: { code: 'ADMIN' },
    update: {},
    create: {
      name: 'บริหาร',
      code: 'ADMIN',
      description: 'งานธุรการและบริหารทั่วไป',
    },
  });

  const deptHr = await prisma.department.upsert({
    where: { code: 'HR' },
    update: {},
    create: {
      name: 'ทรัพยากรมนุษย์',
      code: 'HR',
      description: 'งานทรัพยากรบุคคล',
    },
  });

  const categoryComputer = await prisma.category.upsert({
    where: { code: 'COMP' },
    update: {},
    create: {
      name: 'คอมพิวเตอร์',
      code: 'COMP',
      description: 'คอมพิวเตอร์และอุปกรณ์',
    },
  });

  const categoryFurniture = await prisma.category.upsert({
    where: { code: 'FURN' },
    update: {},
    create: {
      name: 'เฟอร์นิเจอร์',
      code: 'FURN',
      description: 'เฟอร์นิเจอร์สำนักงาน',
    },
  });

  const categoryVehicle = await prisma.category.upsert({
    where: { code: 'VEHI' },
    update: {},
    create: {
      name: 'ยานพาหนะ',
      code: 'VEHI',
      description: 'รถยนต์และยานพาหนะ',
    },
  });

  const categoryElectrical = await prisma.category.upsert({
    where: { code: 'ELEC' },
    update: {},
    create: {
      name: 'เครื่องใช้ไฟฟ้า',
      code: 'ELEC',
      description: 'อุปกรณ์ไฟฟ้าและเครื่องใช้สำนักงาน',
    },
  });

  const assets = [
    {
      assetCode: 'AST-2026-001',
      name: 'คอมพิวเตอร์ตั้งโต๊ะ Dell',
      description: 'Dell OptiPlex 7090',
      categoryId: categoryComputer.id,
      serialNumber: 'SN-DL-001',
      purchasePrice: 25000,
      purchaseDate: new Date('2024-01-15'),
      usefulLifeYears: 5,
      salvageValue: 2500,
      depreciationMethod: 'straight_line' as const,
      location: 'ห้อง 101',
      departmentId: deptIt.id,
      status: 'active' as const,
      condition: 'good',
    },
    {
      assetCode: 'AST-2026-002',
      name: 'เครื่องพิมพ์ HP LaserJet',
      description: 'HP LaserJet Pro M404n',
      categoryId: categoryComputer.id,
      serialNumber: 'SN-HP-002',
      purchasePrice: 8500,
      purchaseDate: new Date('2024-02-20'),
      usefulLifeYears: 5,
      salvageValue: 850,
      depreciationMethod: 'straight_line' as const,
      location: 'ห้อง 102',
      departmentId: deptAdmin.id,
      status: 'active' as const,
      condition: 'excellent',
    },
    {
      assetCode: 'AST-2026-003',
      name: 'โต๊ะทำงานไม้',
      description: 'โต๊ะทำงานขนาด 1.2 เมตร',
      categoryId: categoryFurniture.id,
      serialNumber: 'SN-FN-003',
      purchasePrice: 3500,
      purchaseDate: new Date('2023-06-10'),
      usefulLifeYears: 10,
      salvageValue: 350,
      depreciationMethod: 'straight_line' as const,
      location: 'ห้อง 201',
      departmentId: deptHr.id,
      status: 'active' as const,
      condition: 'good',
    },
    {
      assetCode: 'AST-2026-004',
      name: 'รถยนต์ Toyota Camry',
      description: 'Toyota Camry 2.5G',
      categoryId: categoryVehicle.id,
      serialNumber: 'VIN-123456',
      purchasePrice: 950000,
      purchaseDate: new Date('2023-03-01'),
      usefulLifeYears: 8,
      salvageValue: 95000,
      depreciationMethod: 'declining_balance' as const,
      location: 'ลานจอดรถ',
      departmentId: deptAdmin.id,
      status: 'active' as const,
      condition: 'excellent',
    },
    {
      assetCode: 'AST-2026-005',
      name: 'เครื่องปรับอากาศ',
      description: 'Daikin Inverter 18000 BTU',
      categoryId: categoryElectrical.id,
      serialNumber: 'SN-DK-005',
      purchasePrice: 15000,
      purchaseDate: new Date('2024-04-01'),
      usefulLifeYears: 10,
      salvageValue: 1500,
      depreciationMethod: 'straight_line' as const,
      location: 'ห้องประชุม',
      departmentId: deptAdmin.id,
      status: 'maintenance' as const,
      condition: 'fair',
    },
  ];

  for (const asset of assets) {
    await prisma.asset.upsert({
      where: { assetCode: asset.assetCode },
      update: {},
      create: asset,
    });
  }

  for (const asset of assets) {
    const assetRecord = await prisma.asset.findUnique({
      where: { assetCode: asset.assetCode },
    });

    if (!assetRecord) continue;

    const depreciationExpense =
      asset.depreciationMethod === 'straight_line'
        ? (asset.purchasePrice - asset.salvageValue) / asset.usefulLifeYears
        : asset.purchasePrice * 0.2;

    const existingRecord = await prisma.depreciationRecord.findFirst({
      where: {
        assetId: assetRecord.id,
        fiscalYear: 2024,
      },
    });

    if (!existingRecord) {
      await prisma.depreciationRecord.create({
        data: {
          assetId: assetRecord.id,
          fiscalYear: 2024,
          beginningBookValue: asset.purchasePrice,
          depreciationExpense,
          accumulatedDepreciation: depreciationExpense,
          endingBookValue: asset.purchasePrice - depreciationExpense,
        },
      });
    }
  }

  const maintenanceAsset = await prisma.asset.findUnique({
    where: { assetCode: 'AST-2026-005' },
  });

  if (maintenanceAsset) {
    const existingMaintenance = await prisma.maintenanceRecord.findFirst({
      where: {
        assetId: maintenanceAsset.id,
        title: 'บำรุงรักษาเครื่องปรับอากาศ',
      },
    });

    if (!existingMaintenance) {
      await prisma.maintenanceRecord.create({
        data: {
          assetId: maintenanceAsset.id,
          maintenanceType: 'preventive',
          title: 'บำรุงรักษาเครื่องปรับอากาศ',
          description: 'ทำความสะอาดฟิลเตอร์และตรวจสอบระบบ',
          priority: 'medium',
          scheduledDate: new Date('2026-04-01'),
          status: 'pending',
          laborCost: 700,
          technicianName: 'ช่างสมชาย',
        },
      });
    }
  }

  console.log('Seed complete');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
