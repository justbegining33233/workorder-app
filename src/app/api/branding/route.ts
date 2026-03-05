import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const auth = authenticateRequest(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const shopId = auth.role === 'shop' ? auth.id : (auth as any).shopId;
  if (!shopId) return NextResponse.json({ error: 'No shop' }, { status: 400 });
  try {
    const branding = await prisma.shopBranding.findUnique({ where: { shopId } });
    return NextResponse.json(branding || { shopId, primaryColor: '#e5332a', accentColor: '#1f2937' });
  } catch (error) {
    console.error('Error fetching branding:', error);
    return NextResponse.json({ error: 'Failed to fetch branding' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = authenticateRequest(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const shopId = auth.role === 'shop' ? auth.id : (auth as any).shopId;
  if (!shopId) return NextResponse.json({ error: 'No shop' }, { status: 400 });
  try {
    const body = await req.json();
    const branding = await prisma.shopBranding.upsert({
      where: { shopId },
      update: { logoUrl: body.logoUrl, primaryColor: body.primaryColor, accentColor: body.accentColor, tagline: body.tagline, welcomeMessage: body.welcomeMessage, footerText: body.footerText },
      create: { shopId, logoUrl: body.logoUrl, primaryColor: body.primaryColor || '#e5332a', accentColor: body.accentColor || '#1f2937', tagline: body.tagline, welcomeMessage: body.welcomeMessage, footerText: body.footerText },
    });
    return NextResponse.json(branding);
  } catch (error) {
    console.error('Error saving branding:', error);
    return NextResponse.json({ error: 'Failed to save branding' }, { status: 500 });
  }
}
