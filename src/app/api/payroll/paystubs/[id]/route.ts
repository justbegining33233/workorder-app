import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';

// GET /api/payroll/paystubs/[id]
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = authenticateRequest(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const shopId = auth.role === 'shop' ? auth.id : (auth as any).shopId;
  if (!shopId) return NextResponse.json({ error: 'No shop context' }, { status: 400 });

  const { id } = await params;
  const stub = await prisma.payStub.findFirst({
    where: { id, shopId },
    include: {
      tech: true,
      payPeriod: true,
    },
  });

  if (!stub) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(stub);
}

// PUT /api/payroll/paystubs/[id] - approve, mark paid, add bonus/reimbursement
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = authenticateRequest(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const shopId = auth.role === 'shop' ? auth.id : (auth as any).shopId;
  if (!shopId) return NextResponse.json({ error: 'No shop context' }, { status: 400 });
  if (auth.role !== 'shop') return NextResponse.json({ error: 'Shop owner only' }, { status: 403 });

  const { id } = await params;
  const body = await req.json();

  // Recalculate net if bonus/reimbursement added
  let extraData: any = {};
  if (body.bonusPay !== undefined || body.reimbursements !== undefined) {
    const stub = await prisma.payStub.findFirst({ where: { id, shopId } });
    if (stub) {
      const bonus = body.bonusPay ?? stub.bonusPay;
      const reimb = body.reimbursements ?? stub.reimbursements;
      const gross = stub.regularPay + stub.overtimePay + stub.doubleTimePay + stub.ptoPay + bonus + reimb;
      const net = gross - stub.totalDeductions;
      extraData = { grossPay: gross, netPay: net };
    }
  }

  const stub = await prisma.payStub.update({
    where: { id, shopId },
    data: {
      ...(body.status && { status: body.status }),
      ...(body.bonusPay !== undefined && { bonusPay: body.bonusPay }),
      ...(body.reimbursements !== undefined && { reimbursements: body.reimbursements }),
      ...(body.paidVia && { paidVia: body.paidVia }),
      ...(body.checkNumber && { checkNumber: body.checkNumber }),
      ...(body.notes !== undefined && { notes: body.notes }),
      ...(body.status === 'paid' && { paidAt: new Date() }),
      ...extraData,
    },
    include: {
      tech: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  return NextResponse.json(stub);
}
