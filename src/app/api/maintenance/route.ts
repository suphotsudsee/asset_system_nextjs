import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getRequestIp } from '@/lib/request-ip';
import { getSessionFromCookie, verifyJWT } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get('cookie') || undefined;
    const session = getSessionFromCookie(cookieHeader);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await verifyJWT(session);

    const maintenances = await prisma.maintenanceRecord.findMany({
      include: {
        asset: {
          select: {
            assetCode: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(maintenances);
  } catch (error) {
    console.error('Failed to fetch maintenances:', error);
    return NextResponse.json({ error: 'Failed to fetch maintenances' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get('cookie') || undefined;
    const session = getSessionFromCookie(cookieHeader);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const payload = await verifyJWT(session);

    const body = await request.json();
    const laborCost = Number(body.laborCost || 0);
    const partsCost = Number(body.partsCost || 0);
    const maintenance = await prisma.maintenanceRecord.create({
      data: {
        assetId: body.assetId,
        maintenanceType: body.maintenanceType,
        title: body.title,
        description: body.description,
        priority: body.priority,
        scheduledDate: body.scheduledDate ? new Date(body.scheduledDate) : null,
        status: body.status,
        laborCost,
        totalCost: laborCost + partsCost,
        technicianName: body.technicianName,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: payload.userId,
        action: 'CREATE',
        entityType: 'MaintenanceRecord',
        entityId: maintenance.id,
        newValues: JSON.stringify({
          assetId: body.assetId,
          maintenanceType: body.maintenanceType,
          title: body.title,
          status: body.status,
        }),
        ipAddress: getRequestIp(request),
        userAgent: request.headers.get('user-agent') || undefined,
      },
    });

    return NextResponse.json(maintenance);
  } catch (error) {
    console.error('Failed to create maintenance:', error);
    return NextResponse.json({ error: 'Failed to create maintenance' }, { status: 500 });
  }
}

