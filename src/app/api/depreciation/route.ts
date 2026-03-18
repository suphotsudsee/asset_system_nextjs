import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionFromCookie, verifyJWT } from '@/lib/auth';

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
            },
          },
        },
        orderBy: { fiscalYear: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.depreciationRecord.count(),
    ]);

    return NextResponse.json({
      depreciations: depreciations.map((record) => ({
        ...record,
        depreciationMethod: record.asset.depreciationMethod,
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
