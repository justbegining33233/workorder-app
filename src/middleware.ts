import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  const nativeCookie = request.cookies.get('x-fixtray-native')?.value;
  const ua = request.headers.get('user-agent') ?? '';
  const isAndroidNativeUA = ua.includes('FixTray-Android-App-Pro');
  const isIosNativeUA = ua.includes('FixTray-iOS-App-Pro');
  if (nativeCookie === 'android' || nativeCookie === 'ios') {
    requestHeaders.set('x-fixtray-native', nativeCookie);
  } else if (isAndroidNativeUA) {
    requestHeaders.set('x-fixtray-native', 'android');
  } else if (isIosNativeUA) {
    requestHeaders.set('x-fixtray-native', 'ios');
  }
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
};