import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionFromCookie, verifyJWT } from '@/lib/auth';

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(categories);
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
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
    if (payload.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const code = typeof body.code === 'string' ? body.code.trim() : '';
    const description =
      typeof body.description === 'string' && body.description.trim()
        ? body.description.trim()
        : null;

    if (!name || !code) {
      return NextResponse.json(
        { error: 'Name and code required' },
        { status: 400 }
      );
    }

    const [existingByName, existingByCode] = await Promise.all([
      prisma.category.findUnique({ where: { name } }),
      prisma.category.findUnique({ where: { code } }),
    ]);

    if (existingByName || existingByCode) {
      return NextResponse.json(
        { error: 'Category name or code already exists' },
        { status: 409 }
      );
    }

    const category = await prisma.category.create({
      data: { name, code, description },
    });

    await prisma.auditLog.create({
      data: {
        userId: payload.userId,
        action: 'CREATE',
        entityType: 'Category',
        entityId: category.id,
        newValues: JSON.stringify({ name, code, description }),
        ipAddress: request.headers.get('x-forwarded-for') || request.ip,
        userAgent: request.headers.get('user-agent') || undefined,
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error('Category creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
