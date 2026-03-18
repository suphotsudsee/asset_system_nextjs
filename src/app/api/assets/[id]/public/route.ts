import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/assets/[id]/public - Get single asset without authentication (for QR scan)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const asset = await prisma.asset.findUnique({
      where: { id: parseInt(id) },
      include: {
        category: true,
        department: true,
      },
    });

    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    // Return only safe fields (no sensitive data)
    const publicAsset = {
      id: asset.id,
      assetCode: asset.assetCode,
      name: asset.name,
      description: asset.description,
      image: asset.imageData,
      purchasePrice: asset.purchasePrice,
      purchaseDate: asset.purchaseDate,
      status: asset.status,
      condition: asset.condition,
      department: asset.department?.name ?? null,
      location: asset.location,
      serialNumber: asset.serialNumber,
      category: asset.category ? {
        id: asset.category.id,
        name: asset.category.name,
        code: asset.category.code,
      } : null,
    };

    return NextResponse.json(publicAsset);
  } catch (error) {
    console.error('Public asset fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
