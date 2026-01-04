import fs from 'fs';
import path from 'path';
import { PortalRole, PortalChatMessage } from '@/types/portalChat';

const DATA_DIR = path.join(process.cwd(), '.data');
const DATA_FILE = path.join(DATA_DIR, 'portal-chat.json');

// role-scoped channels for broadcasts; sharedChannels for cross-role pairs (tech+manager)
let portalChatStore: {
  byRole: Record<PortalRole, Record<string, PortalChatMessage[]>>;
  sharedChannels: Record<string, PortalChatMessage[]>; // for pair: channels
} = {
  byRole: {
    tech: { global: [] },
    manager: { global: [] },
  },
  sharedChannels: {},
};

function normalizeStore(store: unknown) {
  const base = {
    byRole: {
      tech: { global: [] },
      manager: { global: [] },
    },
    sharedChannels: {},
  } as typeof portalChatStore;

  const storeObj = store as any;

  // legacy shape (per-role flat map)
  if (store && !storeObj.byRole && (storeObj.tech || storeObj.manager)) {
    base.byRole.tech = storeObj.tech || { global: [] };
    base.byRole.manager = storeObj.manager || { global: [] };
    base.sharedChannels = {};
    return base;
  }

  if (store && storeObj.byRole) {
    base.byRole.tech = storeObj.byRole.tech || { global: [] };
    base.byRole.manager = storeObj.byRole.manager || { global: [] };
  }
  if (store && storeObj.sharedChannels) {
    base.sharedChannels = storeObj.sharedChannels;
  }
  return base;
}

function ensureDataDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch {
    // ignore
  }
}

function loadFromDisk() {
  ensureDataDir();
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed) portalChatStore = normalizeStore(parsed);
    }
  } catch {
    // ignore and keep in-memory
  }
}

function persistToDisk() {
  ensureDataDir();
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(portalChatStore, null, 2), 'utf-8');
  } catch {
    // ignore
  }
}

loadFromDisk();

function getRoleChannel(role: PortalRole, channelId: string) {
  if (!portalChatStore.byRole[role]) portalChatStore.byRole[role] = {} as Record<string, PortalChatMessage[]>;
  if (!portalChatStore.byRole[role][channelId]) portalChatStore.byRole[role][channelId] = [];
  return portalChatStore.byRole[role][channelId];
}

function getSharedChannel(channelId: string) {
  if (!portalChatStore.sharedChannels[channelId]) portalChatStore.sharedChannels[channelId] = [];
  return portalChatStore.sharedChannels[channelId];
}

export function getPortalMessages(role: PortalRole, channelId = 'global'): PortalChatMessage[] {
  const isShared = channelId.startsWith('pair:');
  const channel = isShared ? getSharedChannel(channelId) : getRoleChannel(role, channelId);
  return [...channel].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

export function addPortalMessage(role: PortalRole, sender: string, body: string, channelId = 'global'): PortalChatMessage {
  const msg: PortalChatMessage = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    sender,
    body,
    timestamp: new Date(),
    channelId,
  };
  const isShared = channelId.startsWith('pair:');
  const channel = isShared ? getSharedChannel(channelId) : getRoleChannel(role, channelId);
  channel.push(msg);
  persistToDisk();
  return msg;
}
