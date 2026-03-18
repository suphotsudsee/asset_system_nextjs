import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionFromCookie, verifyJWT } from '@/lib/auth';

// GET /api/departments/[id] - Get single department
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

    const department = await prisma.department.findUnique({
      where: { id: parseInt(id) },
    });

    if (!department) {
      return NextResponse.json({ error: 'Department not found' }, { status: 404 });
    }

    return NextResponse.json(department);
  } catch (error) {
    console.error('Department fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/departments/[id] - Update department
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

    // Only admin can update departments
    if (payload.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, code, description } = body;

    const department = await prisma.department.findUnique({
      where: { id: parseInt(id) },
    });

    if (!department) {
      return NextResponse.json({ error: 'Department not found' }, { status: 404 });
    }

    // Check duplicate code (if code is being changed)
    if (code && code !== department.code) {
      const existing = await prisma.department.findUnique({
        where: { code },
      });

      if (existing) {
        return NextResponse.json(
          { error: 'Department code already exists' },
          { status: 409 }
        );
      }
    }

    const updated = await prisma.department.update({
      where: { id: parseInt(id) },
      data: {
        name: name || department.name,
        code: code || department.code,
        description: description !== undefined ? description : department.description,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Department update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/departments/[id] - Delete department
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

    // Only admin can delete departments
    if (payload.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;

    const department = await prisma.department.findUnique({
      where: { id: parseInt(id) },
    });

    if (!department) {
      return NextResponse.json({ error: 'Department not found' }, { status: 404 });
    }

    // Check if department is being used
    const assetsCount = await prisma.asset.count({
      where: { departmentId: parseInt(id) },
    });

    const usersCount = await prisma.user.count({
      where: { departmentId: parseInt(id) },
    });

    if (assetsCount > 0 || usersCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete department with associated assets or users' },
        { status: 409 }
      );
    }

    await prisma.department.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ message: 'Department deleted' });
  } catch (error) {
    console.error('Department deletion error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
