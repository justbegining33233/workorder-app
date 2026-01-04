import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from './auth';

const AUTH_COOKIE = 'sos_auth';
const REFRESH_ENDPOINT = '/api/auth/refresh';

function parseJwtPayload(token: string): any | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = Buffer.from(b64, 'base64').toString('utf8');
    return JSON.parse(json);
  } catch (e) {
    return null;
  }
}

// Attempt to return a valid access token string. If the existing access token
// cookie is expired or missing, call the refresh endpoint (with the request
// cookies) and return any access token the refresh endpoint returns.
export async function tryRefreshAccessToken(req: NextRequest): Promise<string | null> {
  const token = req.cookies.get(AUTH_COOKIE)?.value;
  if (token) {
    const payload = parseJwtPayload(token);
    if (payload && (!payload.exp || payload.exp * 1000 > Date.now())) {
      return token;
    }
  }

  try {
    const origin = req.nextUrl.origin;
    const refreshRes = await fetch(`${origin}${REFRESH_ENDPOINT}`, {
      method: 'POST',
      headers: { cookie: req.headers.get('cookie') || '' },
    });

    if (refreshRes.ok) {
      const data = await refreshRes.json();
      const accessToken = data.accessToken || data.token || null;
      return accessToken || null;
    }
  } catch (err) {
    // swallow errors so callers can handle anonymous flows
  }

  return null;
}

// Server-side helper that attempts a refresh and returns a NextResponse that has
// the `sos_auth` cookie set when successful, otherwise null.
export async function tryRefresh(req: NextRequest): Promise<NextResponse | null> {
  const accessToken = await tryRefreshAccessToken(req);
  if (!accessToken) return null;

  const res = NextResponse.next();
  res.cookies.set(AUTH_COOKIE, accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 15,
  });
  return res;
}

export function parseAccessTokenFromRequest(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE)?.value || null;
  if (!token) return null;
  try {
    const payload = verifyToken(token);
    return payload || null;
  } catch (e) {
    return null;
  }
}

export default tryRefreshAccessToken;
