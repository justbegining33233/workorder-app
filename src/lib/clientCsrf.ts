export function getCsrfToken(): string | null {
  if (typeof document === 'undefined') return null;
  const m = document.cookie.split(';').map(s => s.trim()).find(s => s.startsWith('csrf_token='));
  return m ? decodeURIComponent(m.split('=')[1]) : null;
}
