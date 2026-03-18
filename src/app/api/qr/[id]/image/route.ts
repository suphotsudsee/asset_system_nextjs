import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionFromCookie, verifyJWT } from '@/lib/auth';
import { buildAssetQrPayload } from '@/lib/qr-payload';
import { getAssetQrUrl } from '@/lib/app-url';
import QRCode from 'qrcode';

// GET /api/qr/[id]/image - Return QR code as PNG image
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
        department: true,
        category: true,
      },
    });

    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    // Multi-tenancy check
    if (payload.role !== 'admin' && asset.agencyId !== payload.agencyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const qrData = buildAssetQrPayload({
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

    // Generate QR code as PNG data URL
    const qrCodeImage = await QRCode.toDataURL(qrData, {
      width: 300,
      margin: 2,
      errorCorrectionLevel: 'L',
    });

    // Convert data URL to base64
    const base64Data = qrCodeImage.split(',')[1];

    // Return as PNG image
    return new NextResponse(Buffer.from(base64Data, 'base64'), {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    });
  } catch (error) {
    console.error('QR code image generation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
