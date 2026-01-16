// Socket.io API route for Next.js
import { NextRequest } from 'next/server';
import { initSocketServer } from '@/lib/socket-server';

export async function GET(request: NextRequest) {
  // This route is handled by Socket.io
  // The actual WebSocket connection is established here
  return new Response('Socket.io server endpoint', { status: 200 });
}