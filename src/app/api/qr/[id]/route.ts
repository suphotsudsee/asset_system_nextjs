import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionFromCookie, verifyJWT } from '@/lib/auth';
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

    const payload = await verifyJWT(session);
    const { id } = await params;

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

    const qrUrl = `${process.env.NEXT_PUBLIC_APP_URL}/qr/${asset.id}`;

    // Generate QR code as PNG buffer
    const qrCodeImage = await QRCode.toDataURL(qrUrl, {
      width: 300,
      margin: 2,
      errorCorrectionLevel: 'M',
    });

    return NextResponse.json({
      assetId: asset.id,
      assetCode: asset.assetCode,
      qrCodeImage,
      qrData: qrUrl,
    });
  } catch (error) {
    console.error('QR code generation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
