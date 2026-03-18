import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionFromCookie, verifyJWT } from '@/lib/auth';

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
    const categoryId = parseInt(id, 10);

    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    return NextResponse.json(category);
  } catch (error) {
    console.error('Category fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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
    if (payload.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const categoryId = parseInt(id, 10);
    const body = await request.json();

    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    const name =
      typeof body.name === 'string' && body.name.trim()
        ? body.name.trim()
        : category.name;
    const code =
      typeof body.code === 'string' && body.code.trim()
        ? body.code.trim()
        : category.code;
    const description =
      body.description === undefined
        ? category.description
        : typeof body.description === 'string' && body.description.trim()
          ? body.description.trim()
          : null;

    if (name !== category.name) {
      const existingByName = await prisma.category.findUnique({
        where: { name },
      });

      if (existingByName) {
        return NextResponse.json(
          { error: 'Category name already exists' },
          { status: 409 }
        );
      }
    }

    if (code !== category.code) {
      const existingByCode = await prisma.category.findUnique({
        where: { code },
      });

      if (existingByCode) {
        return NextResponse.json(
          { error: 'Category code already exists' },
          { status: 409 }
        );
      }
    }

    const updated = await prisma.category.update({
      where: { id: categoryId },
      data: { name, code, description },
    });

    await prisma.auditLog.create({
      data: {
        userId: payload.userId,
        action: 'UPDATE',
        entityType: 'Category',
        entityId: category.id,
        oldValues: JSON.stringify({
          name: category.name,
          code: category.code,
          description: category.description,
        }),
        newValues: JSON.stringify({ name, code, description }),
        ipAddress: request.headers.get('x-forwarded-for') || request.ip,
        userAgent: request.headers.get('user-agent') || undefined,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Category update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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
    if (payload.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const categoryId = parseInt(id, 10);

    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    const assetsCount = await prisma.asset.count({
      where: { categoryId },
    });

    if (assetsCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete category with associated assets' },
        { status: 409 }
      );
    }

    await prisma.auditLog.create({
      data: {
        userId: payload.userId,
        action: 'DELETE',
        entityType: 'Category',
        entityId: category.id,
        oldValues: JSON.stringify({
          name: category.name,
          code: category.code,
          description: category.description,
        }),
        ipAddress: request.headers.get('x-forwarded-for') || request.ip,
        userAgent: request.headers.get('user-agent') || undefined,
      },
    });

    await prisma.category.delete({
      where: { id: categoryId },
    });

    return NextResponse.json({ message: 'Category deleted' });
  } catch (error) {
    console.error('Category deletion error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
