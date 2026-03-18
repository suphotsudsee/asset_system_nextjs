import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionFromCookie, verifyJWT } from '@/lib/auth';
import { buildAssetQrPayload } from '@/lib/qr-payload';
import { getAssetQrUrl } from '@/lib/app-url';
import QRCode from 'qrcode';

// GET /api/qr/[id]/download - Download QR code as PNG file
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

    // Return as PNG file with download header
    const fileName = `QR_${asset.assetCode}.png`;
    
    return new NextResponse(Buffer.from(base64Data, 'base64'), {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('QR code download error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
