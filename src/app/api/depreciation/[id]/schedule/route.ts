import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionFromCookie, verifyJWT } from '@/lib/auth';
import { calculateStraightLine, calculateDecliningBalance } from '@/lib/depreciation';

// GET /api/depreciation/[id]/schedule - Calculate depreciation schedule
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieHeader = request.headers.get('cookie') || undefined;
    const session = getSessionFromCookie(cookieHeader);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await verifyJWT(session);
    const { id } = await params;

    const asset = await prisma.asset.findUnique({
      where: { id: parseInt(id) },
    });

    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    // Calculate schedule based on method
    let schedule;
    if (asset.depreciationMethod === 'declining_balance') {
      schedule = calculateDecliningBalance({
        purchasePrice: asset.purchasePrice,
        salvageValue: asset.salvageValue,
        usefulLifeYears: asset.usefulLifeYears,
        purchaseDate: asset.purchaseDate,
        method: 'declining_balance',
      });
    } else {
      schedule = calculateStraightLine({
        purchasePrice: asset.purchasePrice,
        salvageValue: asset.salvageValue,
        usefulLifeYears: asset.usefulLifeYears,
        purchaseDate: asset.purchaseDate,
        method: 'straight_line',
      });
    }

    return NextResponse.json({
      asset: {
        id: asset.id,
        assetCode: asset.assetCode,
        name: asset.name,
        purchasePrice: asset.purchasePrice,
        salvageValue: asset.salvageValue,
        usefulLifeYears: asset.usefulLifeYears,
        purchaseDate: asset.purchaseDate,
        depreciationMethod: asset.depreciationMethod,
      },
      schedule,
    });
  } catch (error) {
    console.error('Depreciation schedule error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
