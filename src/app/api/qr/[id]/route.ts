import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionFromCookie, verifyJWT } from '@/lib/auth';
import { buildAssetQrPayload } from '@/lib/qr-payload';
import { getAssetQrUrl } from '@/lib/app-url';
import QRCode from 'qrcode';

// GET /api/qr/[id] - Generate QR code for asset
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
      include: {
        department: true,
        category: true,
      },
    });

    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    const qrPayload = buildAssetQrPayload({
      id: asset.id,
      assetCode: asset.assetCode,
      name: asset.name,
      department: asset.department?.name ?? null,
      status: asset.status,
      category: asset.category?.name ?? null,
      location: asset.location,
      serialNumber: asset.serialNumber,
      openUrl: getAssetQrUrl(request, asset.id),
    });

    // Generate QR code as PNG buffer
    const qrCodeImage = await QRCode.toDataURL(qrPayload, {
      width: 300,
      margin: 2,
      errorCorrectionLevel: 'L',
    });

    return NextResponse.json({
      assetId: asset.id,
      assetCode: asset.assetCode,
      qrCodeImage,
      qrData: qrPayload,
    });
  } catch (error) {
    console.error('QR code generation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
