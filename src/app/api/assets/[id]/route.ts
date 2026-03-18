import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionFromCookie, verifyJWT } from '@/lib/auth';

function getImageData(body: Record<string, unknown>): string | null | undefined {
  if (body.image === null || body.imageData === null) {
    return null;
  }

  if (typeof body.imageData === 'string') {
    return body.imageData.trim() ? body.imageData : null;
  }

  if (typeof body.image === 'string') {
    return body.image.trim() ? body.image : null;
  }

  return undefined;
}

// GET /api/assets/[id] - Get single asset
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

    const payload = await verifyJWT(session);
    const { id } = await params;

    const asset = await prisma.asset.findUnique({
      where: { id: parseInt(id) },
      include: {
        category: true,
        department: true,
        depreciationRecords: {
          orderBy: { fiscalYear: 'desc' },
        },
        maintenanceRecords: {
          orderBy: { createdAt: 'desc' },
        },
        transactions: {
          orderBy: { transactionDate: 'desc' },
        },
      },
    });

    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    // Multi-tenancy check
    if (payload.role !== 'admin' && asset.agencyId !== payload.agencyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Map imageData to image for frontend compatibility
    const assetWithImage = {
      ...asset,
      image: asset.imageData,
    };

    return NextResponse.json(assetWithImage);
  } catch (error) {
    console.error('Asset fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/assets/[id] - Update asset
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieHeader = request.headers.get('cookie') || undefined;
    const session = getSessionFromCookie(cookieHeader);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyJWT(session);
    const { id } = await params;

    // Check permissions
    if (!['admin', 'agency_admin', 'asset_manager'].includes(payload.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const asset = await prisma.asset.findUnique({
      where: { id: parseInt(id) },
    });

    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    // Multi-tenancy check
    if (payload.role !== 'admin' && asset.agencyId !== payload.agencyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const data: Record<string, unknown> = {};

    if (typeof body.assetCode === 'string') data.assetCode = body.assetCode;
    if (typeof body.name === 'string') data.name = body.name;
    if (body.description === null || typeof body.description === 'string') data.description = body.description;
    if (body.categoryId === null || body.categoryId === undefined || Number.isInteger(body.categoryId)) {
      data.categoryId = body.categoryId ?? null;
    }
    if (body.serialNumber === null || typeof body.serialNumber === 'string') data.serialNumber = body.serialNumber;
    if (body.purchasePrice === null || typeof body.purchasePrice === 'number') data.purchasePrice = body.purchasePrice;
    if (body.purchaseDate === null || body.purchaseDate === undefined || typeof body.purchaseDate === 'string') {
      data.purchaseDate = body.purchaseDate ? new Date(body.purchaseDate) : null;
    }
    if (body.usefulLifeYears === null || body.usefulLifeYears === undefined || Number.isInteger(body.usefulLifeYears)) {
      data.usefulLifeYears = body.usefulLifeYears ?? null;
    }
    if (typeof body.salvageValue === 'number') data.salvageValue = body.salvageValue;
    if (typeof body.depreciationMethod === 'string') data.depreciationMethod = body.depreciationMethod;
    if (body.location === null || typeof body.location === 'string') data.location = body.location;
    if (body.departmentId === null || Number.isInteger(body.departmentId)) {
      data.departmentId = body.departmentId ?? null;
    }
    if (typeof body.status === 'string') data.status = body.status;
    if (typeof body.condition === 'string') data.condition = body.condition;
    const imageData = getImageData(body as Record<string, unknown>);
    if (imageData !== undefined) data.imageData = imageData;

    const updated = await prisma.asset.update({
      where: { id: parseInt(id) },
      data,
      include: {
        category: true,
        department: true,
      },
    });

    // Create audit log for update
    await prisma.auditLog.create({
      data: {
        userId: payload.userId,
        action: 'UPDATE',
        entityType: 'Asset',
        entityId: asset.id,
        oldValues: JSON.stringify({
          assetCode: asset.assetCode,
          name: asset.name,
          categoryId: asset.categoryId,
          departmentId: asset.departmentId,
          status: asset.status,
        }),
        newValues: JSON.stringify({
          assetCode: data.assetCode ?? asset.assetCode,
          name: data.name ?? asset.name,
          categoryId: data.categoryId ?? asset.categoryId,
          departmentId: data.departmentId ?? asset.departmentId,
          status: data.status ?? asset.status,
        }),
        ipAddress: request.headers.get('x-forwarded-for') || request.ip,
        userAgent: request.headers.get('user-agent') || undefined,
      },
    });

    return NextResponse.json({ ...updated, image: updated.imageData });
  } catch (error) {
    console.error('Asset update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/assets/[id] - Delete asset
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieHeader = request.headers.get('cookie') || undefined;
    const session = getSessionFromCookie(cookieHeader);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyJWT(session);
    const { id } = await params;

    // Only admin can delete
    if (payload.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const asset = await prisma.asset.findUnique({
      where: { id: parseInt(id) },
    });

    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    // Create audit log before deletion
    await prisma.auditLog.create({
      data: {
        userId: payload.userId,
        action: 'DELETE',
        entityType: 'Asset',
        entityId: asset.id,
        oldValues: JSON.stringify({
          assetCode: asset.assetCode,
          name: asset.name,
          categoryId: asset.categoryId,
          departmentId: asset.departmentId,
          status: asset.status,
        }),
        ipAddress: request.headers.get('x-forwarded-for') || request.ip,
        userAgent: request.headers.get('user-agent') || undefined,
      },
    });

    await prisma.$transaction([
      prisma.qRCode.deleteMany({
        where: { assetId: asset.id },
      }),
      prisma.depreciationRecord.deleteMany({
        where: { assetId: asset.id },
      }),
      prisma.maintenanceRecord.deleteMany({
        where: { assetId: asset.id },
      }),
      prisma.assetTransaction.deleteMany({
        where: { assetId: asset.id },
      }),
      prisma.asset.delete({
        where: { id: parseInt(id) },
      }),
    ]);

    return NextResponse.json({ message: 'Asset deleted' });
  } catch (error) {
    console.error('Asset deletion error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
