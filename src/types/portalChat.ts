export type PortalRole = 'tech' | 'manager';

export interface PortalChatMessage {
  id: string;
  sender: string;
  body: string;
  timestamp: Date;
  channelId?: string;
}
