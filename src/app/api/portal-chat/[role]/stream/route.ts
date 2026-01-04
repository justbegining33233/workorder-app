import { NextRequest } from 'next/server';
import { getPortalMessages } from '@/lib/portalChat';
import { PortalRole } from '@/types/portalChat';

// Use nodejs runtime because portalChat persistence relies on fs
export const runtime = 'nodejs';

export async function GET(req: NextRequest, { params }: { params: Promise<{ role: string }> }) {
  const { role } = await params;
  if (!['tech', 'manager'].includes(role)) {
    return new Response('Invalid role', { status: 400 });
  }
  const channelId = req.nextUrl.searchParams.get('channel') || 'global';

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      const send = () => {
        const messages = getPortalMessages(role as PortalRole, channelId);
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(messages)}\n\n`));
      };

      send();
      const interval = setInterval(send, 2000);
      controller.enqueue(encoder.encode(': ping\n\n'));
      return () => clearInterval(interval);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
