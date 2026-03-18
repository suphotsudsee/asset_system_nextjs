import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionFromCookie, verifyJWT, hashPassword } from '@/lib/auth';

// GET /api/users/[id] - Get single user
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

    // Only admin can view other users
    if (payload.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      include: {
        department: {
          select: {
            name: true,
            code: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      department: user.department?.name,
      position: user.position,
      isActive: user.isActive,
      createdAt: user.createdAt,
    });
  } catch (error) {
    console.error('User fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/users/[id] - Update user
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

    // Only admin can update users
    if (payload.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const data: Record<string, unknown> = {};

    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (typeof body.username === 'string') data.username = body.username;
    if (typeof body.email === 'string') data.email = body.email;
    if (typeof body.fullName === 'string') data.fullName = body.fullName;
    if (body.fullName === null) data.fullName = null;
    if (typeof body.role === 'string') data.role = body.role;
    if (body.departmentId === null || body.departmentId === undefined || Number.isInteger(body.departmentId)) {
      data.departmentId = body.departmentId ?? null;
    }
    if (body.position === null || typeof body.position === 'string') data.position = body.position;
    if (typeof body.isActive === 'boolean') data.isActive = body.isActive;
    
    // Hash password if provided
    if (typeof body.password === 'string' && body.password.trim()) {
      data.hashedPassword = await hashPassword(body.password);
    }

    const updated = await prisma.user.update({
      where: { id: parseInt(id) },
      data,
      include: {
        department: true,
      },
    });

    // Create audit log for update
    await prisma.auditLog.create({
      data: {
        userId: payload.userId,
        action: 'UPDATE',
        entityType: 'User',
        entityId: user.id,
        oldValues: JSON.stringify({
          username: user.username,
          email: user.email,
          role: user.role,
          departmentId: user.departmentId,
          isActive: user.isActive,
        }),
        newValues: JSON.stringify({
          username: data.username ?? user.username,
          email: data.email ?? user.email,
          role: data.role ?? user.role,
          departmentId: data.departmentId ?? user.departmentId,
          isActive: data.isActive ?? user.isActive,
        }),
        ipAddress: request.headers.get('x-forwarded-for') || request.ip,
        userAgent: request.headers.get('user-agent') || undefined,
      },
    });

    return NextResponse.json({
      id: updated.id,
      username: updated.username,
      email: updated.email,
      fullName: updated.fullName,
      role: updated.role,
      department: updated.department?.name,
      position: updated.position,
      isActive: updated.isActive,
      createdAt: updated.createdAt,
    });
  } catch (error) {
    console.error('User update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/users/[id] - Delete user
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

    // Only admin can delete users
    if (payload.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prevent deleting yourself
    if (user.id === payload.userId) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 409 }
      );
    }

    // Create audit log before deletion
    await prisma.auditLog.create({
      data: {
        userId: payload.userId,
        action: 'DELETE',
        entityType: 'User',
        entityId: user.id,
        oldValues: JSON.stringify({
          username: user.username,
          email: user.email,
          role: user.role,
          departmentId: user.departmentId,
        }),
        ipAddress: request.headers.get('x-forwarded-for') || request.ip,
        userAgent: request.headers.get('user-agent') || undefined,
      },
    });

    await prisma.user.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ message: 'User deleted' });
  } catch (error) {
    console.error('User deletion error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
