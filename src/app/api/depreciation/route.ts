import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionFromCookie, verifyJWT } from '@/lib/auth';
import { calculateDecliningBalance, calculateStraightLine } from '@/lib/depreciation';

export async function GET(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get('cookie') || undefined;
    const session = getSessionFromCookie(cookieHeader);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await verifyJWT(session);

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const [depreciations, total] = await Promise.all([
      prisma.depreciationRecord.findMany({
        include: {
          asset: {
            select: {
              assetCode: true,
              name: true,
              depreciationMethod: true,
              department: {
                select: {
                  name: true,
                },
              },
              category: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        orderBy: { fiscalYear: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.depreciationRecord.count(),
    ]);

    if (total === 0) {
      const [assets, assetsTotal] = await Promise.all([
        prisma.asset.findMany({
          select: {
            id: true,
            assetCode: true,
            name: true,
            purchasePrice: true,
            purchaseDate: true,
            salvageValue: true,
            usefulLifeYears: true,
            depreciationMethod: true,
            department: {
              select: {
                name: true,
              },
            },
            category: {
              select: {
                name: true,
              },
            },
          },
          where: {
            purchasePrice: { not: null },
            purchaseDate: { not: null },
          },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.asset.count({
          where: {
            purchasePrice: { not: null },
            purchaseDate: { not: null },
          },
        }),
      ]);

      const derivedDepreciations = assets
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
            id: asset.id,
            assetId: asset.id,
            fiscalYear: latest.year,
            fiscalPeriod: String(latest.year),
            beginningBookValue: purchasePrice,
            depreciationExpense: latest.depreciationExpense,
            accumulatedDepreciation: latest.accumulatedDepreciation,
            endingBookValue: latest.endingBookValue,
            depreciationMethod: asset.depreciationMethod,
            asset: {
              assetCode: asset.assetCode,
              name: asset.name,
              department: asset.department?.name ?? null,
              category: asset.category?.name ?? null,
            },
          };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null);

      return NextResponse.json({
        depreciations: derivedDepreciations,
        total: assetsTotal,
        page,
        limit,
        totalPages: Math.ceil(assetsTotal / limit),
      });
    }

    return NextResponse.json({
      depreciations: depreciations.map((record) => ({
        ...record,
        depreciationMethod: record.asset.depreciationMethod,
        asset: {
          ...record.asset,
          department: record.asset.department?.name ?? null,
          category: record.asset.category?.name ?? null,
        },
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Failed to fetch depreciations:', error);
    return NextResponse.json({ error: 'Failed to fetch depreciations' }, { status: 500 });
  }
}
