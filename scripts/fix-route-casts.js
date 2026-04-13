const fs = require('fs');
const path = require('path');

const files = [
  'src/components/KeyboardShortcuts.tsx',
  'src/contexts/AuthContext.tsx',
  'src/app/customer/rewards/page.tsx',
  'src/app/customer/appointments/page.tsx',
  'src/app/workorders/[id]/page.tsx',
  'src/app/workorders/new/page.tsx',
  'src/app/tech/new-roadside-job/page.tsx',
  'src/app/tech/new-inshop-job/page.tsx',
  'src/app/tech/enhanced/page.tsx',
  'src/app/shop/subscribe/page.tsx',
  'src/app/shop/settings/page.tsx',
  'src/app/shop/new-inshop-job/page.tsx',
  'src/app/shop/complete-profile/page.tsx',
  'src/app/shop/admin/page.tsx',
  'src/app/shop/admin/employee/[id]/page.tsx',
  'src/app/shop/customers/[id]/crm/page.tsx',
  'src/app/admin/subscriptions/page.tsx',
  'src/app/admin/shop-details/[id]/page.tsx',
  'src/app/admin/revenue/page.tsx',
  'src/app/admin/manage-customers/page.tsx',
  'src/app/admin/login/page.tsx',
  'src/app/admin/enhanced/page.tsx',
  'src/app/admin/dashboard/page.tsx',
  'src/app/admin/coupons/page.tsx',
  'src/app/admin/command-center/page.tsx',
  'src/app/manager/home/page.tsx',
  'src/app/manager/estimates/page.tsx',
  'src/app/payment/success/page.tsx',
  'src/components/WorkOrderForm.tsx',
  'src/components/TopNavBar.tsx',
  'src/components/ShopRegistrationForm.tsx',
  'src/components/NotificationBell.tsx',
  'src/components/NewAppointmentClient.tsx',
  'src/components/LoginClient.tsx',
  'src/components/RecentlyViewed.tsx',
  // Files that already have Route import but may have uncast calls
  'src/app/admin/home/page.tsx',
  'src/app/shop/home/page.tsx',
  'src/app/tech/home/page.tsx',
  'src/app/auth/thank-you/page.tsx',
  'src/app/workorders/inshop/page.tsx',
  'src/app/customer/insights/page.tsx',
  'src/app/manager/inventory/page.tsx',
];

let fixed = 0;
let importAdded = 0;

for (const f of files) {
  const fp = path.join(__dirname, '..', f);
  if (!fs.existsSync(fp)) { console.log('SKIP (not found):', f); continue; }
  let content = fs.readFileSync(fp, 'utf8');
  let changed = false;

  // Add Route import if not present
  if (!content.includes("import type { Route } from 'next'")) {
    if (content.includes("from 'next/navigation'")) {
      content = content.replace(
        /(from 'next\/navigation';)/,
        "$1\nimport type { Route } from 'next';"
      );
      changed = true;
      importAdded++;
    } else if (content.includes("from 'next/link'")) {
      content = content.replace(
        /(from 'next\/link';)/,
        "$1\nimport type { Route } from 'next';"
      );
      changed = true;
      importAdded++;
    }
  }

  // Fix router.push(...) without 'as Route'
  const pushRegex = /router\.push\(([^)]+)\)/g;
  content = content.replace(pushRegex, (match, arg) => {
    arg = arg.trim();
    if (arg.includes('as Route')) return match;
    fixed++;
    changed = true;
    return 'router.push(' + arg + ' as Route)';
  });

  // Fix router.replace(...) without 'as Route'
  const replaceRegex = /router\.replace\(([^)]+)\)/g;
  content = content.replace(replaceRegex, (match, arg) => {
    arg = arg.trim();
    if (arg.includes('as Route')) return match;
    fixed++;
    changed = true;
    return 'router.replace(' + arg + ' as Route)';
  });

  if (changed) {
    fs.writeFileSync(fp, content, 'utf8');
    console.log('Fixed:', f);
  }
}

console.log('\nDone. Imports added:', importAdded, '| Push/replace casts:', fixed);
