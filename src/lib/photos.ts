import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const PHOTOS_FILE = path.join(DATA_DIR, 'photos.json');

export type PhotoMeta = {
  id: string;
  url: string;
  filename?: string;
  caption?: string;
  workOrderId?: string | null;
  uploadedBy?: string | null;
  createdAt: string;
};

export function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(PHOTOS_FILE)) fs.writeFileSync(PHOTOS_FILE, '[]', 'utf8');
}

export function loadPhotos(): PhotoMeta[] {
  try {
    ensureDataDir();
    const raw = fs.readFileSync(PHOTOS_FILE, 'utf8');
    return JSON.parse(raw || '[]');
  } catch (err) {
    console.error('Failed to load photos.json', err);
    return [];
  }
}

export function savePhotos(list: PhotoMeta[]) {
  try {
    ensureDataDir();
    fs.writeFileSync(PHOTOS_FILE, JSON.stringify(list, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to save photos.json', err);
  }
}

export function addPhoto(photo: PhotoMeta) {
  const list = loadPhotos();
  list.unshift(photo);
  savePhotos(list);
  return photo;
}
