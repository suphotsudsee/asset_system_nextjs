import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionFromCookie, verifyJWT, hashPassword } from '@/lib/auth';

// GET /api/users - List all users
export async function GET(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get('cookie') || undefined;
    const session = getSessionFromCookie(cookieHeader);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyJWT(session);

    // Only admin can view all users
    if (payload.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      include: {
        department: {
          select: {
            name: true,
            code: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Transform data for frontend
    const usersFormatted = users.map((u) => ({
      id: u.id,
      username: u.username,
      email: u.email,
      fullName: u.fullName,
      role: u.role,
      department: u.department?.name ?? null,
      position: u.position,
      isActive: u.isActive,
      createdAt: u.createdAt,
    }));

    return NextResponse.json(usersFormatted);
  } catch (error) {
    console.error('Users fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/users - Create new user
export async function POST(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get('cookie') || undefined;
    const session = getSessionFromCookie(cookieHeader);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyJWT(session);

    // Only admin can create users
    if (payload.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const {
      username,
      email,
      password,
      fullName,
      role,
      departmentId,
      position,
      isActive,
    } = body;

    // Validate required fields
    if (!username || !email || !password || !role) {
      return NextResponse.json(
        { error: 'Required fields missing' },
        { status: 400 }
      );
    }

    // Check duplicate username
    const existingUsername = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUsername) {
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 409 }
      );
    }

    // Check duplicate email
    const existingEmail = await prisma.user.findUnique({
      where: { email },
    });

    if (existingEmail) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        username,
        email,
        hashedPassword,
        fullName: fullName || null,
        role: role || 'staff',
        departmentId: departmentId ? parseInt(departmentId) : null,
        position: position || null,
        isActive: isActive !== undefined ? isActive : true,
      },
      include: {
        department: true,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: payload.userId,
        action: 'CREATE',
        entityType: 'User',
        entityId: user.id,
        newValues: JSON.stringify({
          username,
          email,
          role,
          departmentId,
        }),
        ipAddress: request.headers.get('x-forwarded-for') || request.ip,
        userAgent: request.headers.get('user-agent') || undefined,
      },
    });

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
    }, { status: 201 });
  } catch (error) {
    console.error('User creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
