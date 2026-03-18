import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
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
    const body = await request.json();
    const maintenance = await prisma.maintenanceRecord.create({
      data: {
        assetId: body.assetId,
        maintenanceType: body.maintenanceType,
        title: body.title,
        description: body.description,
        priority: body.priority,
        scheduledDate: body.scheduledDate ? new Date(body.scheduledDate) : null,
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        status: body.status,
        laborCost: body.laborCost || 0,
        partsCost: body.partsCost || 0,
        totalCost: (body.laborCost || 0) + (body.partsCost || 0),
        technicianName: body.technicianName,
      },
    });
    return NextResponse.json(maintenance);
  } catch (error) {
    console.error('Failed to create maintenance:', error);
    return NextResponse.json({ error: 'Failed to create maintenance' }, { status: 500 });
  }
}
