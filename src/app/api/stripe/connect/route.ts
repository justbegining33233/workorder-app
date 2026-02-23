import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';

/**
 * GET /api/stripe/connect
 * Redirects a shop owner to Stripe's OAuth page to connect their payout account.
 * After approval, Stripe sends them back to /api/stripe/connect/callback
 */
export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  if (auth.role !== 'shop') {
    return NextResponse.json({ error: 'Only shop accounts can connect Stripe' }, { status: 403 });
  }

  const clientId = process.env.STRIPE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: 'Stripe Connect not configured' }, { status: 500 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://workorder-app-five.vercel.app';
  const redirectUri = `${appUrl}/api/stripe/connect/callback`;

  // state = shop's user ID so we can identify them on callback
  const state = auth.id;

  const oauthUrl = new URL('https://connect.stripe.com/oauth/authorize');
  oauthUrl.searchParams.set('response_type', 'code');
  oauthUrl.searchParams.set('client_id', clientId);
  oauthUrl.searchParams.set('scope', 'read_write');
  oauthUrl.searchParams.set('redirect_uri', redirectUri);
  oauthUrl.searchParams.set('state', state);
  // Pre-fill shop type so they land on the right Stripe onboarding
  oauthUrl.searchParams.set('stripe_user[business_type]', 'company');

  return NextResponse.redirect(oauthUrl.toString());
}
