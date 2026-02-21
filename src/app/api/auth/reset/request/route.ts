import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { generateNumericOTP, generateTokenHex, hashTokenSha256 } from '@/lib/verification';
import { getClientIP } from '@/lib/rateLimit';

async function sendByEmail(email: string, raw: string, siteUrl: string) {
  if (process.env.SENDGRID_API_KEY) {
    const sg = (await import('@sendgrid/mail')).default;
    sg.setApiKey(process.env.SENDGRID_API_KEY);
    const from = process.env.EMAIL_FROM || 'no-reply@example.com';
    await sg.send({ to: email, from, subject: 'Your verification code', text: `Your code: ${raw}`, html: `<p>Your code: <strong>${raw}</strong></p><p>Or click <a href="${siteUrl}/auth/reset?token=${raw}">here</a></p>` });
    return true;
  }
  // Fallback: log to server console for dev
  console.log('Verification token for', email, raw);
  try {
    const req = require;
    const fs = req('fs');
    const path = req('path');
    const dir = path.join(process.cwd(), 'tmp');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    const file = path.join(dir, 'reset-debug.log');
    fs.appendFileSync(file, `${new Date().toISOString()} ${email} ${raw}\n`);
  } catch (e) {
    // ignore file write errors in dev
  }
  return false;
}

async function sendBySms(phone: string, raw: string) {
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM) {
    try {
      const req = require;
      const twilioLib = req('twilio');
      const client = twilioLib(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      await client.messages.create({ to: phone, from: process.env.TWILIO_FROM, body: `Your verification code: ${raw}` });
      return true;
    } catch (e) {
      console.warn('Twilio unavailable at runtime or failed to send SMS:', (e as any)?.message || e);
      // fall through to console fallback
    }
  }
  console.log('SMS token for', phone, raw);
  return false;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const identifier = body.identifier; // email or phone or username
    const via = body.via || 'email'; // 'email' or 'sms'
    const type = body.type || 'password_reset';
    const siteUrl = process.env.SITE_URL || '';

    if (!identifier) return NextResponse.json({ success: true }); // generic response

    // Find user (try admin by username, then shop, then customer by email)
    let user: any = null;
    // attempt email lookup
    user = await prisma.admin.findUnique({ where: { username: identifier } });
    if (!user) user = await prisma.shop.findUnique({ where: { username: identifier } });
    if (!user) user = await prisma.customer.findUnique({ where: { email: identifier } });
    if (!user) user = await prisma.tech.findUnique({ where: { email: identifier } });

    // Always respond success to avoid account enumeration, but only send token if user exists
    if (!user) return NextResponse.json({ success: true });

    // Generate token: numeric for SMS, hex for email/link
    const raw = via === 'sms' ? generateNumericOTP(6) : generateTokenHex(24);
    const tokenHash = hashTokenSha256(raw);
    const expiresAt = new Date(Date.now() + (via === 'sms' ? 5 : 15) * 60 * 1000);

    // Store token record (production) — if this fails, fall back to console logging
    try {
      await prisma.verificationToken.create({ data: {
        userId: user.id,
        type,
        tokenHash,
        expiresAt,
        metadata: JSON.stringify({ ip: getClientIP(request), via }),
      }});
    } catch (e) {
      console.warn('Could not write verificationToken record (maybe model missing):', (e as any)?.message || e);
      // still continue to attempt delivery (dev fallback will log the raw token)
    }

    // Send the token via configured provider or console fallback
    try {
      if (via === 'sms' && user.phone) {
        await sendBySms(user.phone, raw);
      } else if (user.email) {
        await sendByEmail(user.email, raw, siteUrl);
      } else {
        console.log('No delivery method for user', user.id);
      }
    } catch (e) {
      console.error('Delivery failed:', e);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Reset request error:', err);
    return NextResponse.json({ success: true });
  }
}
