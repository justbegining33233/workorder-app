'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Breadcrumbs() {
  const pathname = usePathname() || '';
  
  // Generate breadcrumb items from pathname
  const generateBreadcrumbs = () => {
    const paths = pathname.split('/').filter(Boolean);
    const breadcrumbs: { label: string; href: string }[] = [];
    
    // Map of path segments to readable labels
    const labelMap: Record<string, string> = {
      shop: 'Shop',
      admin: 'Admin Dashboard',
      manager: 'Manager',
      tech: 'Technician',
      home: 'Home',
      'manage-team': 'Team Management',
      settings: 'Settings',
      'all-tools': 'All Tools',
      photos: 'Photos',
      employee: 'Employee',
      reports: 'Reports',
      customer: 'Customer',
      auth: 'Authentication',
      login: 'Login',
    };
    
    let currentPath = '';
    
    paths.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const label = labelMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
      
      breadcrumbs.push({
        label,
        href: currentPath,
      });
    });
    
    return breadcrumbs;
  };
  
  const breadcrumbs = generateBreadcrumbs();
  
  // Don't show breadcrumbs on homepage or login pages
  if (breadcrumbs.length <= 1 || pathname.includes('/auth/')) {
    return null;
  }
  
  return (
    <nav style={{
      padding: '12px 24px',
      background: 'rgba(0,0,0,0.2)',
      borderBottom: '1px solid rgba(255,255,255,0.1)',
    }}>
      <div style={{
        maxWidth: 1400,
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        flexWrap: 'wrap',
      }}>
        {/* Home Link */}
        <Link
          href="/"
          style={{
            color: '#9ca3af',
            textDecoration: 'none',
            fontSize: 13,
            fontWeight: 500,
            transition: 'color 0.2s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#e5e7eb'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}
        >
          🏠 Home
        </Link>
        
        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1;
          
          return (
            <div key={crumb.href} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: '#4b5563', fontSize: 13 }}>›</span>
              {isLast ? (
                <span style={{
                  color: '#e5332a',
                  fontSize: 13,
                  fontWeight: 600,
                }}>
                  {crumb.label}
                </span>
              ) : (
                <Link
                  href={crumb.href}
                  style={{
                    color: '#9ca3af',
                    textDecoration: 'none',
                    fontSize: 13,
                    fontWeight: 500,
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#e5e7eb'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}
                >
                  {crumb.label}
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </nav>
  );
}
