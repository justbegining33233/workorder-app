import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * GET /api/stripe/connect/callback
 * Stripe redirects here after the shop owner authorizes the OAuth connection.
 * Exchanges the auth code for a connected account ID and saves it to the shop.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state'); // shop user ID
  const error = searchParams.get('error');
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://workorder-app-five.vercel.app';

  if (error || !code || !state) {
    console.error('Stripe Connect OAuth error:', error);
    return NextResponse.redirect(`${appUrl}/shop/settings?stripe_connect=error&tab=billing`);
  }

  try {
    // Exchange authorization code for connected account ID
    const tokenRes = await fetch('https://connect.stripe.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_secret: process.env.STRIPE_SECRET_KEY!,
        code,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenRes.json();

    if (tokenData.error || !tokenData.stripe_user_id) {
      console.error('Stripe token exchange failed:', tokenData);
      return NextResponse.redirect(`${appUrl}/shop/settings?stripe_connect=error&tab=billing`);
    }

    // Save the connected account ID to the shop
    await prisma.shop.update({
      where: { id: state },
      data: { stripeAccountId: tokenData.stripe_user_id },
    });

    return NextResponse.redirect(`${appUrl}/shop/settings?stripe_connect=success&tab=billing`);
  } catch (err) {
    console.error('Stripe Connect callback error:', err);
    return NextResponse.redirect(`${appUrl}/shop/settings?stripe_connect=error&tab=billing`);
  }
}
