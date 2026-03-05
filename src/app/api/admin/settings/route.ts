import { NextRequest, NextResponse } from 'next/server';

import { requireRole, AuthUser } from '@/lib/auth';
import { getSettings, updateSettings, resetSettings } from '@/lib/platform-settings';

export async function GET(request: NextRequest) {
  const auth = requireRole(request, ['admin', 'superadmin']);
  if (auth instanceof NextResponse) return auth;
  return NextResponse.json({ settings: getSettings() });
}

export async function PUT(request: NextRequest) {
  const auth = requireRole(request, ['admin', 'superadmin']);
  if (auth instanceof NextResponse) return auth;
  try {
    const body = await request.json();
    const settings = updateSettings(body);
    return NextResponse.json({ settings, message: 'Settings saved successfully' });
  } catch {
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const auth = requireRole(request, ['admin', 'superadmin']);
  if (auth instanceof NextResponse) return auth;
  const settings = resetSettings();
  return NextResponse.json({ settings, message: 'Settings reset to defaults' });
}
