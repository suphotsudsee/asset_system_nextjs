import { NextRequest, NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { getSessionFromCookie, verifyJWT } from '@/lib/auth';

function getImageData(body: Record<string, unknown>): string | null {
  if (body.image === null || body.imageData === null) {
    return null;
  }

  if (typeof body.imageData === 'string') {
    return body.imageData.trim() ? body.imageData : null;
  }

  if (typeof body.image === 'string') {
    return body.image.trim() ? body.image : null;
  }

  return null;
}

// GET /api/assets - List assets with pagination and filters
export async function GET(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get('cookie') || undefined;
    const session = getSessionFromCookie(cookieHeader);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyJWT(session);

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    const where: Prisma.AssetWhereInput = {};

    // Multi-tenancy: filter by agency
    if (payload.role !== 'admin') {
      if (payload.agencyId != null) {
        where.agencyId = payload.agencyId;
      }
    }

    // Filters
    if (status) {
      where.status = status;
    }
    if (category) {
      where.categoryId = parseInt(category);
    }
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { assetCode: { contains: search } },
        { serialNumber: { contains: search } },
      ];
    }

    const [assets, total] = await Promise.all([
      prisma.asset.findMany({
        where,
        include: {
          category: true,
          department: true,
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.asset.count({ where }),
    ]);

    // Map imageData to image for frontend compatibility
    const assetsWithImage = assets.map((a) => ({
      ...a,
      department: a.department?.name ?? null,
      image: a.imageData,
    }));

    return NextResponse.json({
      assets: assetsWithImage,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Assets fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/assets - Create new asset
export async function POST(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get('cookie') || undefined;
    const session = getSessionFromCookie(cookieHeader);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyJWT(session);

    // Check permissions
    if (!['admin', 'agency_admin', 'asset_manager'].includes(payload.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const {
      assetCode,
      name,
      description,
      categoryId,
      serialNumber,
      purchasePrice,
      purchaseDate,
      usefulLifeYears,
      salvageValue,
      depreciationMethod,
      location,
      departmentId,
      status,
      condition,
    } = body;

    const imageData = getImageData(body as Record<string, unknown>);

    // Validate required fields
    if (!assetCode || !name || !categoryId || purchasePrice === null || purchasePrice === undefined || Number.isNaN(Number(purchasePrice))) {
      return NextResponse.json(
        { error: 'Required fields missing' },
        { status: 400 }
      );
    }

    // Check duplicate asset code
    const existing = await prisma.asset.findUnique({
      where: { assetCode },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Asset code already exists' },
        { status: 409 }
      );
    }

    // Create asset
    const asset = await prisma.asset.create({
      data: {
        assetCode,
        name,
        description,
        imageData,
        categoryId,
        serialNumber,
        purchasePrice,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
        usefulLifeYears,
        salvageValue: salvageValue || 0,
        depreciationMethod: depreciationMethod || 'straight_line',
        location,
        departmentId,
        status: status || 'active',
        condition: condition || 'good',
      },
      include: {
        category: true,
        department: true,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: payload.userId,
        action: 'CREATE',
        entityType: 'Asset',
        entityId: asset.id,
        newValues: JSON.stringify({
          assetCode,
          name,
          categoryId,
          departmentId,
          status,
        }),
        ipAddress: request.headers.get('x-forwarded-for') || request.ip,
        userAgent: request.headers.get('user-agent') || undefined,
      },
    });

    return NextResponse.json({ ...asset, image: asset.imageData }, { status: 201 });
  } catch (error) {
    console.error('Asset creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
