import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

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
        return NextResponse.json(categories.map((c) => ({
          category: c.name,
          count: c._count.assets,
        })));
      }
      case 'department': {
        const departments = await prisma.asset.groupBy({
          by: ['department'],
          _count: { id: true },
          _sum: { purchasePrice: true },
        });
        return NextResponse.json(departments.map((d) => ({
          department: d.department || 'ไม่ระบุ',
          count: d._count.id,
          totalValue: d._sum.purchasePrice || 0,
        })));
      }
      case 'status': {
        const statuses = await prisma.asset.groupBy({
          by: ['status'],
          _count: { id: true },
        });
        return NextResponse.json(statuses.map((s) => ({
          status: s.status,
          count: s._count.id,
        })));
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
