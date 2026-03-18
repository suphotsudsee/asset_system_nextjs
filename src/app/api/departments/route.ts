import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getRequestIp } from '@/lib/request-ip';
import { getSessionFromCookie, verifyJWT } from '@/lib/auth';

// GET /api/departments - List all departments
export async function GET(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get('cookie') || undefined;
    const session = getSessionFromCookie(cookieHeader);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await verifyJWT(session);

    const departments = await prisma.department.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(departments);
  } catch (error) {
    console.error('Departments fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/departments - Create new department
export async function POST(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get('cookie') || undefined;
    const session = getSessionFromCookie(cookieHeader);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyJWT(session);

    // Only admin can create departments
    if (payload.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { name, code, description } = body;

    // Validate required fields
    if (!name || !code) {
      return NextResponse.json(
        { error: 'Name and code required' },
        { status: 400 }
      );
    }

    // Check duplicate code
    const existing = await prisma.department.findUnique({
      where: { code },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Department code already exists' },
        { status: 409 }
      );
    }

    // Create department
    const department = await prisma.department.create({
      data: {
        name,
        code,
        description: description || null,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: payload.userId,
        action: 'CREATE',
        entityType: 'Department',
        entityId: department.id,
        newValues: JSON.stringify({ name, code, description }),
        ipAddress: getRequestIp(request),
        userAgent: request.headers.get('user-agent') || undefined,
      },
    });

    return NextResponse.json(department, { status: 201 });
  } catch (error) {
    console.error('Department creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

