import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Public: customer signs via token
export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const wa = await prisma.workAuthorization.findUnique({ where: { authToken: token } });
  if (!wa) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (wa.expiresAt && wa.expiresAt < new Date()) {
    await prisma.workAuthorization.update({ where: { authToken: token }, data: { status: 'expired' } });
    return NextResponse.json({ error: 'expired' }, { status: 410 });
  }
  return NextResponse.json(wa);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const body = await req.json();
  const ip = req.headers.get('x-forwarded-for') || 'unknown';

  if (body._action === 'sign') {
    const wa = await prisma.workAuthorization.update({
      where: { authToken: token },
      data: {
        status: 'signed',
        signatureData: body.signatureData,
        signedAt: new Date(),
        signerName: body.signerName,
        signerIP: ip,
      },
    });
    return NextResponse.json(wa);
  }

  if (body._action === 'decline') {
    const wa = await prisma.workAuthorization.update({
      where: { authToken: token },
      data: { status: 'declined' },
    });
    return NextResponse.json(wa);
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
