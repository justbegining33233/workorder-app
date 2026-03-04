/**
 * smsService.ts
 * Twilio SMS wrapper that gracefully no-ops when credentials are not configured.
 *
 * Required env vars:
 *   TWILIO_ACCOUNT_SID          – starts with "AC"
 *   TWILIO_AUTH_TOKEN           – from Twilio Console
 *   TWILIO_FROM_NUMBER          – your Twilio phone number, e.g. +18886634485
 *   TWILIO_MESSAGING_SERVICE_SID – (optional) use a Messaging Service instead of a fixed from number
 */

let twilioClient: ReturnType<typeof import('twilio')> | null = null;

function getClient() {
  if (twilioClient) return twilioClient;
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  // Only reject if values are missing or still the placeholder defaults
  if (!sid || !token || !sid.startsWith('AC') || token.length < 16) return null;
  // Lazy-load Twilio to avoid cold-start overhead when not configured
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const twilio = require('twilio');
    twilioClient = twilio(sid, token);
    return twilioClient;
  } catch {
    return null;
  }
}

/**
 * Send an SMS message.
 * Returns `true` on success, `false` if not configured or if sending fails.
 * Prefers TWILIO_MESSAGING_SERVICE_SID when set; falls back to TWILIO_FROM_NUMBER.
 */
export async function sendSms(to: string, body: string): Promise<boolean> {
  const client = getClient();
  if (!client || !to) return false;

  // Normalize phone number — Twilio requires E.164 format (+1XXXXXXXXXX)
  const normalized = to.startsWith('+') ? to : `+1${to.replace(/\D/g, '')}`;
  if (normalized.replace(/\D/g, '').length < 10) return false;

  const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;
  const from = process.env.TWILIO_FROM_NUMBER;
  if (!messagingServiceSid && !from) return false;

  try {
    const params: Record<string, string> = { to: normalized, body };
    if (messagingServiceSid) {
      params.messagingServiceSid = messagingServiceSid;
    } else {
      params.from = from!;
    }
    await client.messages.create(params);
    return true;
  } catch (err) {
    // Log but don't throw — SMS failure should never break the main flow
    console.error('[smsService] Failed to send SMS:', (err as Error)?.message);
    return false;
  }
}

/**
 * Send a work order status update SMS to a customer.
 */
export async function sendStatusUpdateSms(
  phone: string,
  workOrderId: string,
  newStatus: string,
): Promise<boolean> {
  const statusMessages: Record<string, string> = {
    'in-progress':         'FixTray: A tech has started working on your vehicle.',
    'waiting-for-payment': 'FixTray: Your work is done! Please review and pay at fixtray.app/customer',
    'closed':              'FixTray: Your work order is complete. Thanks for choosing FixTray!',
    'denied-estimate':     'FixTray: Your estimate was not approved. Log in to see details.',
  };
  const message = statusMessages[newStatus];
  if (!message) return false;
  const tag = ` (WO: ...${workOrderId.slice(-6)})`;
  return sendSms(phone, message + tag);
}

/**
 * Send a two-factor authentication OTP via SMS.
 */
export async function sendOtpSms(phone: string, code: string): Promise<boolean> {
  return sendSms(phone, `FixTray verification code: ${code}. Expires in 10 minutes.`);
}

/**
 * Check whether SMS is configured and operational.
 */
export function isSmsConfigured(): boolean {
  return !!getClient() && !!(process.env.TWILIO_MESSAGING_SERVICE_SID || process.env.TWILIO_FROM_NUMBER);
}
