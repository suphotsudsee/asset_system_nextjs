import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const totalAssets = await prisma.asset.count();
    const activeAssets = await prisma.asset.count({ where: { status: 'active' } });
    
    const assets = await prisma.asset.findMany({
      select: { purchasePrice: true },
    });
    const totalValue = assets.reduce((sum, a) => sum + (a.purchasePrice ?? 0), 0);
    
    const maintenancePending = await prisma.maintenanceRecord.count({
      where: { status: 'pending' },
    });

    return NextResponse.json({
      totalAssets,
      activeAssets,
      totalValue,
      maintenancePending,
    });
  } catch (error) {
    console.error('Failed to fetch stats:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
