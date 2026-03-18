import { AssetStatus, DepreciationMethod, PrismaClient } from '@prisma/client';

export interface GlpiImportResult {
  total: number;
  created: number;
  updated: number;
  skipped: number;
}

type CsvRow = Record<string, string>;
const canonicalHeaders = [
  'name',
  'status',
  'manufacturer',
  'serialNo',
  'type',
  'model',
  'osName',
  'department',
  'lastUpdated',
  'cpu',
  'userName',
] as const;

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
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
      result.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  result.push(current.trim());
  return result;
}

export function parseGlpiCsv(csvText: string): CsvRow[] {
  const normalized = csvText.replace(/^\uFEFF/, '');
  const lines = normalized.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length === 0) return [];

  const headers = parseCsvLine(lines[0]);
  const useCanonicalHeaders = headers.length >= canonicalHeaders.length;

  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    const row: CsvRow = {};

    if (useCanonicalHeaders) {
      canonicalHeaders.forEach((header, index) => {
        row[header] = values[index] ?? '';
      });
    } else {
      headers.forEach((header, index) => {
        row[header] = values[index] ?? '';
      });
    }

    return row;
  });
}

function slugify(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .toUpperCase();
}

function buildCategoryCode(type: string, index: number): string {
  const slug = slugify(type).replace(/[^A-Z0-9-]/g, '').slice(0, 12);
  return `GLPI-CAT-${slug || String(index).padStart(3, '0')}`;
}

function buildDepartmentCode(name: string, index: number): string {
  const slug = slugify(name).replace(/[^A-Z0-9-]/g, '').slice(0, 12);
  return `GLPI-DEPT-${slug || String(index).padStart(3, '0')}`;
}

function buildAssetCode(row: CsvRow, index: number): string {
  const serial = String(row.serialNo || row['Serial No.'] || '').trim();
  const name = String(row.name || row['ชื่อ'] || '').trim();
  const source = serial || name || `ROW-${index + 1}`;
  const slug = slugify(source).replace(/[^A-Z0-9-]/g, '').slice(0, 24);
  return `GLPI-${slug || String(index + 1).padStart(4, '0')}`;
}

function mapStatus(value: string): AssetStatus {
  const normalized = value.trim().toLowerCase();
  if (normalized.includes('dispose')) return AssetStatus.disposed;
  if (normalized.includes('inactive')) return AssetStatus.inactive;
  if (normalized.includes('maintenance')) return AssetStatus.maintenance;
  return AssetStatus.active;
}

function buildDescription(row: CsvRow): string | null {
  const parts = [
    row.manufacturer ? `Manufacturer: ${row.manufacturer}` : '',
    row.model ? `Model: ${row.model}` : '',
    row.osName ? `OS: ${row.osName}` : '',
    row.cpu ? `CPU: ${row.cpu}` : '',
    row.userName ? `User: ${row.userName}` : '',
    row.lastUpdated ? `Last update: ${row.lastUpdated}` : '',
  ].filter(Boolean);

  const combined = parts.join(' | ').slice(0, 250);
  return combined || null;
}

async function ensureCategoryMap(prisma: PrismaClient, rows: CsvRow[]): Promise<Map<string, number>> {
  const distinctTypes = Array.from(new Set(rows.map((row) => row.type?.trim() || row['ประเภท']?.trim() || '').filter(Boolean)));
  const categoryMap = new Map<string, number>();

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

async function ensureDepartmentMap(prisma: PrismaClient, rows: CsvRow[]): Promise<Map<string, number>> {
  const distinctNames = Array.from(new Set(rows.map((row) => row.department?.trim() || row['สาขา-ที่ตั้ง']?.trim() || '').filter(Boolean)));
  const departmentMap = new Map<string, number>();

  for (let index = 0; index < distinctNames.length; index += 1) {
    const name = distinctNames[index];
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

export async function importGlpiRows(prisma: PrismaClient, rows: CsvRow[]): Promise<GlpiImportResult> {
  const categoryMap = await ensureCategoryMap(prisma, rows);
  const departmentMap = await ensureDepartmentMap(prisma, rows);

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    const assetCode = buildAssetCode(row, index);
    const typeName = row.type?.trim() || row['ประเภท']?.trim() || '';
    const departmentName = row.department?.trim() || row['สาขา-ที่ตั้ง']?.trim() || '';
    const serialNumber = row.serialNo?.trim() || row['Serial No.']?.trim() || null;
    const hostName = row.name?.trim() || row['ชื่อ']?.trim() || '';

    if (!assetCode || !hostName) {
      skipped += 1;
      continue;
    }

    const data = {
      assetCode,
      name: hostName,
      description: buildDescription(row),
      categoryId: categoryMap.get(typeName) ?? null,
      serialNumber,
      purchasePrice: 0,
      purchaseDate: null,
      usefulLifeYears: 5,
      salvageValue: 0,
      depreciationMethod: DepreciationMethod.straight_line,
      location: null,
      departmentId: departmentMap.get(departmentName) ?? null,
      status: mapStatus(row.status || row.Status || ''),
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

  return {
    total: rows.length,
    created,
    updated,
    skipped,
  };
}
