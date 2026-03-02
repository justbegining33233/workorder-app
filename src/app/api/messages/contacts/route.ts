import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

/**
 * GET /api/messages/contacts
 *
 * Returns the list of contacts a user is allowed to message, based on role:
 *
 * CUSTOMER: shops + their techs + managers — only when the customer has an active
 *   work order, road-call request, or booked appointment at that shop.
 *
 * SHOP / MANAGER / TECH: fellow staff of the same shop + customers who have an
 *   active work order or appointment at this shop.
 *
 * ADMIN: all shops (as contacts).
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Route to the correct contact resolver
    const { role } = decoded;
    if (role === 'shop' || role === 'manager' || role === 'tech') {
      return getShopSideContacts(decoded);
    }
    if (role === 'admin') {
      return getAdminContacts();
    }
    // Default: customer
    if (role !== 'customer') {
      return NextResponse.json({ error: 'Unknown role' }, { status: 400 });
    }

    const customerId = decoded.id;

    // contactKey → contact object (deduplicated)
    const contactMap = new Map<
      string,
      { id: string; name: string; role: string; shopId: string; contexts: string[] }
    >();

    const addContact = (
      id: string,
      name: string,
      role: string,
      shopId: string,
      context: string,
    ) => {
      const key = `${role}_${id}`;
      if (contactMap.has(key)) {
        const existing = contactMap.get(key)!;
        if (!existing.contexts.includes(context)) {
          existing.contexts.push(context);
        }
      } else {
        contactMap.set(key, { id, name, role, shopId, contexts: [context] });
      }
    };

    // ──────────────────────────────────────────────
    // 1. Active work orders (open in shop OR roadcall)
    // ──────────────────────────────────────────────
    const workOrders = await prisma.workOrder.findMany({
      where: {
        customerId,
        status: { notIn: ['closed', 'denied-estimate'] },
      },
      include: {
        shop: { select: { id: true, shopName: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true, role: true } },
      },
    });

    // Collect unique shopIds so we only query staff once per shop
    const shopIdsFromWOs = [...new Set(workOrders.map((wo) => wo.shop.id))];

    // Fetch all staff for these shops in one query
    const staffByShop = await prisma.tech.findMany({
      where: {
        shopId: { in: shopIdsFromWOs },
        terminatedAt: null, // exclude terminated staff
      },
      select: { id: true, firstName: true, lastName: true, role: true, shopId: true },
    });

    const staffMap = new Map<string, typeof staffByShop>();
    for (const s of staffByShop) {
      if (!staffMap.has(s.shopId)) staffMap.set(s.shopId, []);
      staffMap.get(s.shopId)!.push(s);
    }

    for (const wo of workOrders) {
      const isRoadCall = wo.serviceLocation === 'roadside';
      const label = isRoadCall
        ? `Road Call #${wo.id.slice(-6).toUpperCase()}`
        : `Work Order #${wo.id.slice(-6).toUpperCase()}`;

      // Shop
      addContact(wo.shop.id, wo.shop.shopName, 'shop', wo.shop.id, label);

      // Techs & managers for this shop
      const staff = staffMap.get(wo.shop.id) ?? [];
      for (const s of staff) {
        if (s.role === 'manager' || s.role === 'tech') {
          addContact(
            s.id,
            `${s.firstName} ${s.lastName}`,
            s.role,
            s.shopId,
            label,
          );
        }
      }
    }

    // ──────────────────────────────────────────────
    // 2. Booked / confirmed appointments
    // ──────────────────────────────────────────────
    const appointments = await prisma.appointment.findMany({
      where: {
        customerId,
        status: { in: ['scheduled', 'confirmed'] },
      },
      include: {
        shop: { select: { id: true, shopName: true } },
      },
    });

    const shopIdsFromAppts = [
      ...new Set(appointments.map((a) => a.shop.id).filter((id) => !shopIdsFromWOs.includes(id))),
    ];

    let apptStaffMap = new Map<string, typeof staffByShop>();
    if (shopIdsFromAppts.length > 0) {
      const apptStaff = await prisma.tech.findMany({
        where: { shopId: { in: shopIdsFromAppts }, terminatedAt: null },
        select: { id: true, firstName: true, lastName: true, role: true, shopId: true },
      });
      for (const s of apptStaff) {
        if (!apptStaffMap.has(s.shopId)) apptStaffMap.set(s.shopId, []);
        apptStaffMap.get(s.shopId)!.push(s);
      }
    }

    for (const appt of appointments) {
      const ctx = `Appointment ${new Date(appt.scheduledDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })}`;

      addContact(appt.shop.id, appt.shop.shopName, 'shop', appt.shop.id, ctx);

      const staff =
        staffMap.get(appt.shop.id) ?? apptStaffMap.get(appt.shop.id) ?? [];
      for (const s of staff) {
        if (s.role === 'manager' || s.role === 'tech') {
          addContact(s.id, `${s.firstName} ${s.lastName}`, s.role, s.shopId, ctx);
        }
      }
    }

    const contacts = Array.from(contactMap.values()).map((c) => ({
      ...c,
      contextLabel: c.contexts.join(', '),
    }));

    // Sort: shop first, then manager, then tech; alphabetically within each group
    const roleOrder: Record<string, number> = { shop: 0, manager: 1, tech: 2 };
    contacts.sort((a, b) => {
      const ro = (roleOrder[a.role] ?? 9) - (roleOrder[b.role] ?? 9);
      if (ro !== 0) return ro;
      return a.name.localeCompare(b.name);
    });

    return NextResponse.json({ contacts });
  } catch (error) {
    console.error('Error fetching message contacts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ─── Shop-side contacts (shop / manager / tech) ──────────────────────────────

async function getShopSideContacts(decoded: { id: string; role: string }) {
  try {
    // Determine shopId
    let shopId: string | null = null;
    if (decoded.role === 'shop') {
      shopId = decoded.id;
    } else {
      const staff = await prisma.tech.findUnique({
        where: { id: decoded.id },
        select: { shopId: true },
      });
      shopId = staff?.shopId ?? null;
    }

    if (!shopId) {
      return NextResponse.json({ contacts: [] });
    }

    type StaffContact = { id: string; name: string; role: string; shopId: string; contextLabel: string };
    const contactMap = new Map<string, StaffContact>();

    const addContact = (id: string, name: string, role: string, ctx: string) => {
      const key = `${role}_${id}`;
      if (contactMap.has(key)) {
        const e = contactMap.get(key)!;
        if (!e.contextLabel.includes(ctx)) e.contextLabel += `, ${ctx}`;
      } else {
        contactMap.set(key, { id, name, role, shopId, contextLabel: ctx });
      }
    };

    // 1. All active staff at this shop (excluding self)
    const allStaff = await prisma.tech.findMany({
      where: { shopId, terminatedAt: null },
      select: { id: true, firstName: true, lastName: true, role: true },
    });
    for (const s of allStaff) {
      if (s.id === decoded.id) continue; // skip self
      addContact(s.id, `${s.firstName} ${s.lastName}`, s.role, 'Shop Staff');
    }

    // 2. Customers with active work orders at this shop
    const activeWorkOrders = await prisma.workOrder.findMany({
      where: {
        shopId,
        status: { notIn: ['closed', 'denied-estimate'] },
      },
      include: {
        customer: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    for (const wo of activeWorkOrders) {
      const isRoadCall = wo.serviceLocation === 'roadside';
      const label = isRoadCall
        ? `Road Call #${wo.id.slice(-6).toUpperCase()}`
        : `Work Order #${wo.id.slice(-6).toUpperCase()}`;
      addContact(
        wo.customer.id,
        `${wo.customer.firstName} ${wo.customer.lastName}`,
        'customer',
        label,
      );
    }

    // 3. Customers with booked/confirmed appointments
    const activeAppointments = await prisma.appointment.findMany({
      where: { shopId, status: { in: ['scheduled', 'confirmed'] } },
      include: {
        customer: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    for (const appt of activeAppointments) {
      const ctx = `Appointment ${new Date(appt.scheduledDate).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
      })}`;
      addContact(appt.customer.id, `${appt.customer.firstName} ${appt.customer.lastName}`, 'customer', ctx);
    }

    const roleOrder: Record<string, number> = { customer: 0, manager: 1, tech: 2 };
    const contacts = Array.from(contactMap.values()).sort((a, b) => {
      const ro = (roleOrder[a.role] ?? 9) - (roleOrder[b.role] ?? 9);
      return ro !== 0 ? ro : a.name.localeCompare(b.name);
    });

    return NextResponse.json({ contacts });
  } catch (err) {
    console.error('Error fetching shop-side contacts:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ─── Admin contacts ───────────────────────────────────────────────────────────

async function getAdminContacts() {
  try {
    const shops = await prisma.shop.findMany({
      where: { status: 'approved' },
      select: { id: true, shopName: true },
      orderBy: { shopName: 'asc' },
    });
    const contacts = shops.map((s) => ({
      id: s.id,
      name: s.shopName,
      role: 'shop',
      shopId: s.id,
      contextLabel: 'Approved Shop',
    }));
    return NextResponse.json({ contacts });
  } catch (err) {
    console.error('Error fetching admin contacts:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
