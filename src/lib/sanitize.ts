// XSS sanitization utilities — powered by DOMPurify
import DOMPurify from 'isomorphic-dompurify';

// Sanitize HTML using DOMPurify — strips scripts, event handlers, and dangerous content
export function sanitizeHtml(dirty: string): string {
  if (!dirty) return '';
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'span'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
  });
}

// Sanitize string by escaping HTML special characters
export function escapeHtml(text: string): string {
  if (!text) return '';
  
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };
  
  return text.replace(/[&<>"'/]/g, (char) => map[char]);
}

// Sanitize object recursively
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized = { ...obj };
  
  for (const key in sanitized) {
    const value = sanitized[key];
    
    if (typeof value === 'string') {
      sanitized[key] = sanitizeHtml(value) as any;
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      sanitized[key] = sanitizeObject(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map((item: any) => 
        typeof item === 'string' ? sanitizeHtml(item) : 
        typeof item === 'object' ? sanitizeObject(item) : 
        item
      ) as any;
    }
  }
  
  return sanitized;
}

// Sanitize filename to prevent directory traversal
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/\.{2,}/g, '.')
    .substring(0, 255);
}

// Validate and sanitize URL
export function sanitizeUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return null;
    }
    
    return parsed.toString();
  } catch {
    return null;
  }
}

// Sanitize SQL-like string (for search queries)
export function sanitizeSqlLike(str: string): string {
  return str
    .replace(/[%_\\]/g, '\\$&')
    .substring(0, 100);
}

// Strip all HTML tags
export function stripHtml(html: string): string {
  return DOMPurify.sanitize(html, { ALLOWED_TAGS: [] });
}
