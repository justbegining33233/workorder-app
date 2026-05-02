const fs = require('fs');
const path = require('path');
const { jsPDF } = require('jspdf');
const autoTable = require('jspdf-autotable').default;

const outputPath = path.join(__dirname, '..', 'public', 'launch-go-no-go-checklist.pdf');

const BRAND = {
  navy: [8, 14, 28],
  slate: [19, 28, 46],
  accent: [229, 51, 42],
  accentSoft: [255, 107, 94],
  textDark: [26, 32, 44],
  textMuted: [99, 115, 129],
  white: [255, 255, 255],
  bgAlt: [245, 247, 252],
  ok: [22, 163, 74],
  warn: [217, 119, 6],
  fail: [220, 38, 38],
};

const sections = [
  {
    title: '1) Product Scope Lock',
    items: [
      'Feature list for v1 is frozen',
      'All coming-soon features are clearly labeled',
      'No unfinished pages linked from navigation',
      'Pricing and plan limits are final and consistent',
      'All plan names/descriptions match billing system',
      'Customer-facing copy reviewed and approved',
      'Error messages are user-friendly and actionable',
      'Empty states exist for major pages',
      'No placeholder/demo data in production views',
      'Release notes for v1 are prepared',
    ],
  },
  {
    title: '2) Identity, Auth, and Access Control',
    items: [
      'Login works for every role',
      'Logout clears session and refresh tokens correctly',
      'Session expiration and refresh behavior tested',
      'Password reset flow works end-to-end',
      'Email verification flow works end-to-end',
      '2FA flow works for enabled users',
      'Role-based access is enforced server-side',
      'Unauthorized API calls return 401/403',
      'Privilege escalation attempts are blocked',
      'Superadmin/admin routes are middleware-protected',
      'Manager/tech/shop restrictions enforced in middleware',
      'Tenant/shop scoping enforced in all data queries',
      'Rate limiting on login/reset endpoints verified',
      'CSRF protection active on state-changing endpoints',
    ],
  },
  {
    title: '3) Subscription and Billing',
    items: [
      'Stripe checkout creates subscriptions correctly',
      'Trial start behavior works as expected',
      'Upgrade flow works and updates access correctly',
      'Downgrade flow works and applies restrictions safely',
      'Cancellation flow works with correct end-date handling',
      'Reactivation flow works',
      'Card update flow works',
      'Failed card payment handling works',
      'Webhook signature verification is enforced',
      'Duplicate webhooks are idempotent',
      'Webhook retries/delays handled safely',
      'DB subscription state matches Stripe state',
      'Plan feature gates enforced in UI and API',
      'Plan limits (users/shops/features) enforced',
      'Invoices/receipts available to customer',
    ],
  },
  {
    title: '4) API Surface and Data Contracts',
    items: [
      'Every frontend API call maps to existing route',
      'No 404 API calls in normal browser usage',
      'Request validation exists on all write routes',
      'Response shapes are consistent and documented',
      'Error codes standardized across APIs',
      'Pagination exists for large lists',
      'Sorting/filtering deterministic and tested',
      'Auth requirements explicit per endpoint',
      'Sensitive fields excluded from responses',
      'Rate limiting present for sensitive/public routes',
      'Legacy endpoints removed or redirected',
      'Internal-only endpoints not publicly exposed',
    ],
  },
  {
    title: '5) Database and Data Integrity',
    items: [
      'Schema finalized for launch scope',
      'Migrations apply cleanly in staging and production',
      'Migration rollback plan documented/tested',
      'Indexes and foreign keys reviewed for key queries',
      'Unique constraints set for identity-critical fields',
      'Timezone strategy consistent across app',
      'Monetary precision strategy validated',
      'Audit trail for critical actions exists',
      'Seed/test data removed from production',
      'Data retention and deletion process defined',
      'Data export path documented',
    ],
  },
  {
    title: '6) Integrations and Secrets',
    items: [
      'All required env vars present in production',
      'No placeholder keys remain',
      'Stripe keys + 10 plan IDs configured and tested',
      'Resend email credentials configured and tested',
      'Twilio credentials and sender vars configured and tested',
      'Web push VAPID keys configured and tested',
      'Webhook secrets configured and validated',
      'Third-party callback URLs match production domain',
      'Secrets are stored securely (not in source control)',
      'Previously exposed secrets rotated',
      'Service account permissions least-privilege',
      'Integration failure fallback paths are user-safe',
    ],
  },
  {
    title: '7) Frontend UX and Client Quality',
    items: [
      'Core flows validated on desktop and mobile',
      'Responsive layout validated at common breakpoints',
      'Keyboard navigation works for key workflows',
      'Accessibility baseline checks pass (labels/focus/contrast)',
      'Loading/error/retry states present and clear',
      'Form validation messaging is clear',
      'No frontend console errors in normal use',
      'No broken links or dead-end routes',
      'No flash of unauthorized content before redirect',
      'File uploads work for supported types/sizes',
      'Date/time/currency formatting is consistent',
      'Target browser compatibility tested',
    ],
  },
  {
    title: '8) Performance and Scalability',
    items: [
      'Initial load performance meets budget',
      'Critical pages are within performance targets',
      'Slow APIs identified and optimized',
      'N+1 query hotspots fixed',
      'Caching strategy implemented for expensive reads',
      'Socket features stable under load',
      'Background job throughput tested',
      'Memory profile stable over long sessions',
      'DB pool sizing validated',
      'Basic load test run for peak scenarios',
      'Performance baseline captured for regressions',
    ],
  },
  {
    title: '9) Security Hardening',
    items: [
      'HTTPS enforced in production',
      'Secure cookie flags configured correctly',
      'CSP configured and tested',
      'CORS policy strict and correct',
      'Input sanitization on untrusted content validated',
      'Upload validation/scanning enforced',
      'XSS protections verified in rich content paths',
      'Open redirect/SSRF checks completed',
      'Dependency vulnerability scan triaged',
      'No secrets or tokens in logs',
      'Incident response runbook prepared',
      'Security escalation contacts documented',
    ],
  },
  {
    title: '10) Reliability, Monitoring, and Operations',
    items: [
      'Health endpoints report meaningful status',
      'Sentry enabled in production with release tags',
      'Uptime monitoring active for app and APIs',
      'Alerts configured for 5xx spikes',
      'Alerts configured for auth failures',
      'Alerts configured for payment/webhook failures',
      'Alerts configured for email/SMS provider failures',
      'Request correlation IDs included in logs',
      'On-call ownership assigned for launch window',
      'Operational runbooks available for top incidents',
      'Rollback plan tested and documented',
    ],
  },
  {
    title: '11) QA and Release Validation',
    items: [
      'Smoke suite up to date and passing',
      'Regression suite run on release candidate',
      'E2E tests cover auth, billing, and core work order flow',
      'Manual exploratory pass completed',
      'Defects triaged with severity labels',
      'All blocker defects fixed and verified',
      'All critical defects fixed and verified',
      'Known issues list prepared and approved',
      'Release candidate tagged and immutable',
      'Final UAT sign-off captured',
    ],
  },
  {
    title: '12) Legal, Compliance, and Trust',
    items: [
      'Terms of Service published and accessible',
      'Privacy Policy published and accessible',
      'Consent messaging aligns with data practices',
      'Billing/refund/cancellation terms are visible',
      'Data retention policy documented',
      'Data deletion request process documented',
      'Support contact channels visible in product',
      'Target-market legal requirements reviewed',
      'Escalation path for legal/privacy requests documented',
    ],
  },
  {
    title: '13) Support and Customer Success Readiness',
    items: [
      'Support channels are live (email/help desk/chat)',
      'Triage categories are defined',
      'SLA targets are defined',
      'Support-to-engineering escalation process defined',
      'Troubleshooting playbooks prepared',
      'Common issue response templates prepared',
      'Account recovery procedures documented',
      'Billing dispute process documented',
      'Customer onboarding guide prepared',
      'Week-1 customer check-in process scheduled',
    ],
  },
  {
    title: '14) Launch Day Controls',
    items: [
      'Code freeze active for launch window',
      'Deployment owner and schedule confirmed',
      'Rollback trigger criteria agreed',
      'Launch war-room communication channel active',
      'Live metrics dashboard open pre-deploy',
      'Post-deploy smoke tests executed immediately',
      'Post-deploy payment test transaction verified',
      'Post-deploy email and SMS tests verified',
      'One full golden-path run completed post-deploy',
      'Launch announcement only after all mandatory checks pass',
    ],
  },
  {
    title: '15) First 72 Hours Post-Launch',
    items: [
      'Error rates reviewed hourly day 1',
      'Auth failure trends monitored hourly day 1',
      'Payment conversion monitored continuously',
      'Webhook failure queues monitored',
      'Support ticket themes reviewed daily',
      'Top user-reported issues triaged same day',
      'Hotfix path available and tested',
      'Daily stakeholder summary delivered',
      'Stabilization backlog maintained',
      'Post-launch retrospective scheduled',
    ],
  },
];

function addHeader(doc, pageNum) {
  doc.setFillColor(...BRAND.navy);
  doc.rect(0, 0, 842, 34, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...BRAND.white);
  doc.text('FixTray Launch Go/No-Go Checklist', 18, 22);

  doc.setFillColor(...BRAND.accent);
  doc.roundedRect(670, 8, 150, 18, 4, 4, 'F');
  doc.setFontSize(9);
  doc.text(`Page ${pageNum}`, 745, 20, { align: 'center' });
}

function addCover(doc) {
  doc.setFillColor(...BRAND.navy);
  doc.rect(0, 0, 842, 595, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(42);
  doc.setTextColor(...BRAND.white);
  doc.text('FixTray', 421, 150, { align: 'center' });

  doc.setFontSize(24);
  doc.text('Launch Go/No-Go Checklist', 421, 188, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(13);
  doc.setTextColor(198, 209, 226);
  doc.text('Complete operational checklist for customer-ready launch sign-off', 421, 220, { align: 'center' });

  doc.setFillColor(...BRAND.slate);
  doc.roundedRect(130, 260, 582, 190, 10, 10, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...BRAND.white);
  doc.text('Launch Rule', 158, 292);

  const rules = [
    '1. No open critical issues',
    '2. No open high issues in auth, billing, and core work-order flows',
    '3. All mandatory checks below are marked PASS with evidence links',
    '4. Final sign-off from Engineering, Product, Operations, and Support',
  ];

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  let y = 320;
  for (const rule of rules) {
    doc.text(rule, 160, y);
    y += 28;
  }

  doc.setFillColor(...BRAND.accent);
  doc.roundedRect(130, 470, 582, 46, 8, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...BRAND.white);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 421, 498, { align: 'center' });
}

function sectionTable(doc, section, pageNum) {
  doc.addPage('a4', 'landscape');
  addHeader(doc, pageNum);

  doc.setFillColor(...BRAND.slate);
  doc.rect(0, 44, 842, 30, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...BRAND.white);
  doc.text(section.title, 18, 63);

  const rows = section.items.map((item, idx) => [
    String(idx + 1),
    `[ ] ${item}`,
    '',
    '',
    '',
    '',
  ]);

  autoTable(doc, {
    startY: 84,
    head: [['#', 'Launch Check', 'Owner', 'Status (Pass/Fail/Blocked)', 'Evidence Link / Screenshot', 'Notes']],
    body: rows,
    theme: 'grid',
    margin: { left: 18, right: 18 },
    styles: {
      fontSize: 8.5,
      cellPadding: 4,
      textColor: BRAND.textDark,
      overflow: 'linebreak',
    },
    headStyles: {
      fillColor: BRAND.navy,
      textColor: BRAND.white,
      fontStyle: 'bold',
      halign: 'left',
    },
    alternateRowStyles: {
      fillColor: BRAND.bgAlt,
    },
    columnStyles: {
      0: { cellWidth: 20, halign: 'center' },
      1: { cellWidth: 292 },
      2: { cellWidth: 86 },
      3: { cellWidth: 116 },
      4: { cellWidth: 164 },
      5: { cellWidth: 94 },
    },
    didDrawPage: () => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...BRAND.textMuted);
      doc.text('FixTray Release Control Sheet', 18, 585);
      doc.text('Status Legend: Pass = done, Fail = release blocker, Blocked = external dependency', 320, 585, { align: 'center' });
      doc.setTextColor(...BRAND.accent);
      doc.text('Initials: Eng ___  Prod ___  Ops ___  Support ___', 824, 585, { align: 'right' });
    },
  });
}

const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });

addCover(doc);
let page = 2;

// Summary page
sectionTable(doc, {
  title: 'Section Summary and Release Sign-Off',
  items: sections.map((s) => `${s.title} — ${s.items.length} checks`),
}, page++);

for (const section of sections) {
  sectionTable(doc, section, page++);
}

// Final sign-off page
doc.addPage('a4', 'landscape');
addHeader(doc, page++);
doc.setFillColor(...BRAND.slate);
doc.rect(0, 44, 842, 30, 'F');
doc.setFont('helvetica', 'bold');
doc.setFontSize(13);
doc.setTextColor(...BRAND.white);
doc.text('Final Go/No-Go Sign-Off', 18, 63);

autoTable(doc, {
  startY: 96,
  head: [['Role', 'Owner Name', 'Decision (GO / NO-GO)', 'Date/Time', 'Signature / Initials', 'Notes']],
  body: [
    ['Engineering Lead', '', '', '', '', ''],
    ['Product Lead', '', '', '', '', ''],
    ['Operations Lead', '', '', '', '', ''],
    ['Support Lead', '', '', '', '', ''],
    ['Security Reviewer', '', '', '', '', ''],
    ['Final Launch Approver', '', '', '', '', ''],
  ],
  theme: 'grid',
  margin: { left: 18, right: 18 },
  styles: { fontSize: 10, cellPadding: 8, textColor: BRAND.textDark },
  headStyles: { fillColor: BRAND.navy, textColor: BRAND.white, fontStyle: 'bold' },
  alternateRowStyles: { fillColor: BRAND.bgAlt },
  columnStyles: {
    0: { cellWidth: 124 },
    1: { cellWidth: 112 },
    2: { cellWidth: 132 },
    3: { cellWidth: 94 },
    4: { cellWidth: 112 },
    5: { cellWidth: 168 },
  },
});

doc.setFont('helvetica', 'bold');
doc.setFontSize(12);
doc.setTextColor(...BRAND.accent);
doc.text('Release Decision:', 18, 330);

doc.setDrawColor(...BRAND.accent);
doc.setLineWidth(1.5);
doc.roundedRect(140, 314, 120, 26, 4, 4);
doc.roundedRect(270, 314, 120, 26, 4, 4);
doc.setTextColor(...BRAND.textDark);
doc.text('GO', 200, 332, { align: 'center' });
doc.text('NO-GO', 330, 332, { align: 'center' });

doc.setFont('helvetica', 'normal');
doc.setFontSize(10);
doc.setTextColor(...BRAND.textMuted);
doc.text('All mandatory checks must be PASS with evidence before selecting GO.', 18, 360);

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, Buffer.from(doc.output('arraybuffer')));
console.log(`Launch checklist PDF written to ${outputPath}`);
