/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');
const { PrismaClient, DepreciationMethod, AssetStatus } = require('@prisma/client');

const prisma = new PrismaClient();

function parseCsvLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ';' && !inQuotes) {
      result.push(current);
      current = '';
      continue;
    }

    current += char;
  }

  result.push(current);
  return result.map((value) => value.trim());
}

function parseCsvFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
  const lines = raw.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length === 0) return [];

  const headers = parseCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    const row = {};

    headers.forEach((header, index) => {
      row[header] = values[index] ?? '';
    });

    return row;
  });
}

function slugify(value) {
  return value
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .toUpperCase();
}

function buildCategoryCode(type, index) {
  const slug = slugify(type).replace(/[^A-Z0-9-]/g, '').slice(0, 12);
  return `GLPI-CAT-${slug || String(index).padStart(3, '0')}`;
}

function buildDepartmentCode(name, index) {
  const slug = slugify(name).replace(/[^A-Z0-9-]/g, '').slice(0, 12);
  return `GLPI-DEPT-${slug || String(index).padStart(3, '0')}`;
}

function buildAssetCode(row, index) {
  const serial = String(row['Serial No.'] || '').trim();
  const name = String(row['เธเธทเนเธญ'] || '').trim();
  const source = serial || name || `ROW-${index + 1}`;
  const slug = slugify(source).replace(/[^A-Z0-9-]/g, '').slice(0, 24);
  return `GLPI-${slug || String(index + 1).padStart(4, '0')}`;
}

function mapStatus(value) {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized.includes('dispose')) return AssetStatus.disposed;
  if (normalized.includes('inactive')) return AssetStatus.inactive;
  if (normalized.includes('maintenance')) return AssetStatus.maintenance;
  return AssetStatus.active;
}

async function ensureCategoryMaps(rows) {
  const distinctTypes = Array.from(
    new Set(
      rows
        .map((row) => String(row['เธเธฃเธฐเน€เธ เธ—'] || '').trim())
        .filter(Boolean)
    )
  );

  const categoryMap = new Map();

  for (let index = 0; index < distinctTypes.length; index += 1) {
    const type = distinctTypes[index];
    let category = await prisma.category.findFirst({
      where: {
        OR: [{ name: type }, { code: buildCategoryCode(type, index + 1) }],
      },
    });

    if (!category) {
      category = await prisma.category.create({
        data: {
          name: type,
          code: buildCategoryCode(type, index + 1),
          description: `Imported from GLPI type: ${type}`,
        },
      });
    }

    categoryMap.set(type, category.id);
  }

  return categoryMap;
}

async function ensureDepartmentMaps(rows) {
  const distinctDepartments = Array.from(
    new Set(
      rows
        .map((row) => String(row['เธชเธฒเธเธฒ-เธ—เธตเนเธ•เธฑเนเธ'] || '').trim())
        .filter(Boolean)
    )
  );

  const departmentMap = new Map();

  for (let index = 0; index < distinctDepartments.length; index += 1) {
    const name = distinctDepartments[index];
    let department = await prisma.department.findFirst({
      where: {
        OR: [{ name }, { code: buildDepartmentCode(name, index + 1) }],
      },
    });

    if (!department) {
      department = await prisma.department.create({
        data: {
          name,
          code: buildDepartmentCode(name, index + 1),
          description: 'Imported from GLPI CSV',
        },
      });
    }

    departmentMap.set(name, department.id);
  }

  return departmentMap;
}

function buildDescription(row) {
  const parts = [
    row['เธเธนเนเธเธฅเธดเธ•'] ? `Manufacturer: ${row['เธเธนเนเธเธฅเธดเธ•']}` : '',
    row['เธฃเธธเนเธ'] ? `Model: ${row['เธฃเธธเนเธ']}` : '',
    row['เธฃเธฐเธเธเธเธเธดเธเธฑเธ•เธดเธเธฒเธฃ - เธเธทเนเธญ'] ? `OS: ${row['เธฃเธฐเธเธเธเธเธดเธเธฑเธ•เธดเธเธฒเธฃ - เธเธทเนเธญ']}` : '',
    row['เธชเนเธงเธเธเธฃเธฐเธเธญเธ - CPU'] ? `CPU: ${row['เธชเนเธงเธเธเธฃเธฐเธเธญเธ - CPU']}` : '',
    row['เธเธทเนเธญเธเธนเนเนเธเนเธเธฒเธ'] ? `User: ${row['เธเธทเนเธญเธเธนเนเนเธเนเธเธฒเธ']}` : '',
    row['เธญเธฑเธเน€เธ”เธ—เธฅเนเธฒเธชเธธเธ”'] ? `Last update: ${row['เธญเธฑเธเน€เธ”เธ—เธฅเนเธฒเธชเธธเธ”']}` : '',
  ].filter(Boolean);

  return parts.join(' | ').slice(0, 250);
}

async function main() {
  const inputPath = process.argv[2];

  if (!inputPath) {
    throw new Error('Usage: node scripts/import-glpi-csv.js <csv-path>');
  }

  const resolvedPath = path.resolve(inputPath);
  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`CSV file not found: ${resolvedPath}`);
  }

  const rows = parseCsvFile(resolvedPath);
  if (rows.length === 0) {
    throw new Error('CSV file has no data rows');
  }

  const categoryMap = await ensureCategoryMaps(rows);
  const departmentMap = await ensureDepartmentMaps(rows);

  let created = 0;
  let updated = 0;

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    const assetCode = buildAssetCode(row, index);
    const typeName = String(row['เธเธฃเธฐเน€เธ เธ—'] || '').trim();
    const departmentName = String(row['เธชเธฒเธเธฒ-เธ—เธตเนเธ•เธฑเนเธ'] || '').trim();
    const serialNumber = String(row['Serial No.'] || '').trim() || null;
    const hostName = String(row['เธเธทเนเธญ'] || '').trim() || `Imported Asset ${index + 1}`;
    const manufacturer = String(row['เธเธนเนเธเธฅเธดเธ•'] || '').trim();
    const model = String(row['เธฃเธธเนเธ'] || '').trim();

    const data = {
      assetCode,
      name: manufacturer && model ? `${hostName} - ${manufacturer} ${model}` : hostName,
      description: buildDescription(row) || null,
      categoryId: categoryMap.get(typeName) ?? null,
      serialNumber,
      purchasePrice: 0,
      purchaseDate: null,
      usefulLifeYears: 5,
      salvageValue: 0,
      depreciationMethod: DepreciationMethod.straight_line,
      location: departmentName || null,
      departmentId: departmentMap.get(departmentName) ?? null,
      status: mapStatus(row.Status),
      condition: 'good',
    };

    const existing = await prisma.asset.findUnique({ where: { assetCode } });

    if (existing) {
      await prisma.asset.update({
        where: { assetCode },
        data,
      });
      updated += 1;
    } else {
      await prisma.asset.create({ data });
      created += 1;
    }
  }

  console.log(`GLPI import complete. created=${created}, updated=${updated}, total=${rows.length}`);
}

main()
  .catch((error) => {
    console.error('GLPI import failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

