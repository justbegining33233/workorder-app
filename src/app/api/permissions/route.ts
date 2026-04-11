import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/auth';
import { ALL_PERMISSIONS, getPermissionsForTech } from '@/lib/permissions';

// GET /api/permissions — get permissions for a tech or list all
export async function GET(request: NextRequest) {
  const auth = requireRole(request, ['shop', 'manager', 'admin']);
  if (auth instanceof NextResponse) return auth;

  const shopId = auth.role === 'shop' ? auth.id : auth.shopId;
  if (!shopId) return NextResponse.json({ error: 'Shop ID required' }, { status: 400 });

  const { searchParams } = new URL(request.url);
  const techId = searchParams.get('techId');

  try {
    if (techId) {
      // Get a single tech's effective permissions
      const tech = await prisma.tech.findUnique({
        where: { id: techId },
        select: { id: true, firstName: true, lastName: true, role: true, shopId: true },
      });
      if (!tech || tech.shopId !== shopId) {
        return NextResponse.json({ error: 'Tech not found' }, { status: 404 });
      }

      const permissions = await getPermissionsForTech(shopId, techId, tech.role);
      return NextResponse.json({
        techId: tech.id,
        name: `${tech.firstName} ${tech.lastName}`,
        role: tech.role,
        permissions,
      });
    }

    // List all techs with their permissions
    const techs = await prisma.tech.findMany({
      where: { shopId },
      select: { id: true, firstName: true, lastName: true, role: true },
    });

    const result = await Promise.all(
      techs.map(async tech => ({
        techId: tech.id,
        name: `${tech.firstName} ${tech.lastName}`,
        role: tech.role,
        permissions: await getPermissionsForTech(shopId, tech.id, tech.role),
      }))
    );

    return NextResponse.json({ techs: result, allPermissions: ALL_PERMISSIONS });
  } catch (error) {
    console.error('Error fetching permissions:', error);
    return NextResponse.json({ error: 'Failed to fetch permissions' }, { status: 500 });
  }
}

// PUT /api/permissions — set permission overrides for a tech or role
export async function PUT(request: NextRequest) {
  const auth = requireRole(request, ['shop', 'manager']);
  if (auth instanceof NextResponse) return auth;

  const shopId = auth.role === 'shop' ? auth.id : auth.shopId;
  if (!shopId) return NextResponse.json({ error: 'Shop ID required' }, { status: 400 });

  try {
    const { techId, role, permissions } = await request.json();

    if (!permissions || typeof permissions !== 'object') {
      return NextResponse.json({ error: 'permissions object required' }, { status: 400 });
    }

    if (!techId && !role) {
      return NextResponse.json({ error: 'techId or role required' }, { status: 400 });
    }

    // Validate permissions keys
    for (const key of Object.keys(permissions)) {
      if (!ALL_PERMISSIONS.includes(key)) {
        return NextResponse.json({ error: `Invalid permission: ${key}` }, { status: 400 });
      }
    }

    // If techId, verify tech belongs to this shop
    if (techId) {
      const tech = await prisma.tech.findUnique({ where: { id: techId }, select: { shopId: true } });
      if (!tech || tech.shopId !== shopId) {
        return NextResponse.json({ error: 'Tech not found' }, { status: 404 });
      }
    }

    // Upsert each permission
    const ops = Object.entries(permissions as Record<string, boolean>).map(async ([permission, allowed]) => {
      if (techId) {
        return prisma.permission.upsert({
          where: { shopId_techId_permission: { shopId, techId, permission } },
          create: { shopId, techId, permission, allowed },
          update: { allowed },
        });
      }
      // Role-level: find existing by shopId + role + permission (techId is null)
      const existing = await prisma.permission.findFirst({
        where: { shopId, role, techId: null, permission },
      });
      if (existing) {
        return prisma.permission.update({ where: { id: existing.id }, data: { allowed } });
      }
      return prisma.permission.create({ data: { shopId, role, permission, allowed } });
    });

    await Promise.all(ops);

    return NextResponse.json({ success: true, updated: Object.keys(permissions).length });
  } catch (error) {
    console.error('Error updating permissions:', error);
    return NextResponse.json({ error: 'Failed to update permissions' }, { status: 500 });
  }
}
