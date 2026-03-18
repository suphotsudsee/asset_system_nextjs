import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { calculateDecliningBalance, calculateStraightLine } from '@/lib/depreciation';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') || 'summary';

    switch (type) {
      case 'summary': {
        const assets = await prisma.asset.findMany({
          select: {
            assetCode: true,
            name: true,
            status: true,
            purchasePrice: true,
            category: { select: { name: true } },
          },
        });

        return NextResponse.json(
          assets.map((asset) => ({
            assetCode: asset.assetCode,
            name: asset.name,
            status: asset.status,
            purchasePrice: asset.purchasePrice ?? 0,
            category: asset.category?.name ?? '-',
          }))
        );
      }

      case 'category': {
        const categories = await prisma.category.findMany({
          include: {
            _count: {
              select: { assets: true },
            },
          },
        });

        return NextResponse.json(
          categories.map((category) => ({
            category: category.name,
            count: category._count.assets,
          }))
        );
      }

      case 'department': {
        const groupedDepartments = await prisma.asset.groupBy({
          by: ['departmentId'],
          _count: { id: true },
          _sum: { purchasePrice: true },
        });

        const departmentIds = groupedDepartments
          .map((department) => department.departmentId)
          .filter((id): id is number => id !== null);

        const departmentRecords = departmentIds.length
          ? await prisma.department.findMany({
              where: { id: { in: departmentIds } },
              select: { id: true, name: true },
            })
          : [];

        const departmentNameById = new Map(
          departmentRecords.map((department) => [department.id, department.name])
        );

        return NextResponse.json(
          groupedDepartments.map((department) => ({
            department:
              department.departmentId === null
                ? 'ไม่ระบุ'
                : (departmentNameById.get(department.departmentId) ?? 'ไม่ระบุ'),
            count: department._count.id,
            totalValue: department._sum.purchasePrice || 0,
          }))
        );
      }

      case 'status': {
        const statuses = await prisma.asset.groupBy({
          by: ['status'],
          _count: { id: true },
        });

        return NextResponse.json(
          statuses.map((status) => ({
            status: status.status,
            count: status._count.id,
          }))
        );
      }

      case 'depreciation': {
        const records = await prisma.depreciationRecord.findMany({
          select: {
            fiscalYear: true,
            depreciationExpense: true,
            accumulatedDepreciation: true,
            asset: { select: { assetCode: true, name: true } },
          },
        });

        if (records.length === 0) {
          const assets = await prisma.asset.findMany({
            select: {
              assetCode: true,
              name: true,
              purchasePrice: true,
              purchaseDate: true,
              salvageValue: true,
              usefulLifeYears: true,
              depreciationMethod: true,
            },
            where: {
              purchasePrice: { not: null },
              purchaseDate: { not: null },
            },
            orderBy: { createdAt: 'desc' },
          });

          const derivedRows = assets
            .map((asset) => {
              const purchasePrice = asset.purchasePrice ?? 0;
              const salvageValue = asset.salvageValue ?? 0;
              const usefulLifeYears = asset.usefulLifeYears ?? 5;
              const purchaseDate = asset.purchaseDate;

              if (!purchaseDate || purchasePrice <= 0 || usefulLifeYears <= 0) {
                return null;
              }

              const schedule =
                asset.depreciationMethod === 'declining_balance'
                  ? calculateDecliningBalance({
                      purchasePrice,
                      salvageValue,
                      usefulLifeYears,
                      purchaseDate,
                      method: 'declining_balance',
                    })
                  : calculateStraightLine({
                      purchasePrice,
                      salvageValue,
                      usefulLifeYears,
                      purchaseDate,
                      method: 'straight_line',
                    });

              const latest = schedule[schedule.length - 1];
              if (!latest) {
                return null;
              }

              return {
                fiscalYear: latest.year,
                depreciationExpense: latest.depreciationExpense,
                accumulatedDepreciation: latest.accumulatedDepreciation,
                assetCode: asset.assetCode,
                assetName: asset.name,
              };
            })
            .filter((row): row is NonNullable<typeof row> => row !== null);

          return NextResponse.json(derivedRows);
        }

        return NextResponse.json(
          records.map((record) => ({
            fiscalYear: record.fiscalYear,
            depreciationExpense: record.depreciationExpense,
            accumulatedDepreciation: record.accumulatedDepreciation,
            assetCode: record.asset.assetCode,
            assetName: record.asset.name,
          }))
        );
      }

      default:
        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
    }
  } catch (error) {
    console.error('Failed to generate report:', error);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}
