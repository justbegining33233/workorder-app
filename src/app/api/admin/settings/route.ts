import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { AuthUser } from '@/lib/auth';
import { getSettings, updateSettings, resetSettings } from '@/lib/platform-settings';

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  if ((auth as AuthUser).role !== 'admin') {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  }
  return NextResponse.json({ settings: getSettings() });
}

export async function PUT(request: NextRequest) {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  if ((auth as AuthUser).role !== 'admin') {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  }
  try {
    const body = await request.json();
    const settings = updateSettings(body);
    return NextResponse.json({ settings, message: 'Settings saved successfully' });
  } catch {
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  if ((auth as AuthUser).role !== 'admin') {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  }
  const settings = resetSettings();
  return NextResponse.json({ settings, message: 'Settings reset to defaults' });
}
