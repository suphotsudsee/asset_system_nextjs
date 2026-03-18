import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionFromCookie, verifyJWT } from '@/lib/auth';
import { importGlpiRows, parseGlpiCsv } from '@/lib/glpi-import';

export async function POST(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get('cookie') || undefined;
    const session = getSessionFromCookie(cookieHeader);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyJWT(session);
    if (!['admin', 'agency_admin', 'asset_manager'].includes(payload.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'CSV file is required' }, { status: 400 });
    }

    const text = await file.text();
    const rows = parseGlpiCsv(text);

    if (rows.length === 0) {
      return NextResponse.json({ error: 'CSV file has no rows' }, { status: 400 });
    }

    const result = await importGlpiRows(prisma, rows);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('GLPI import API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
