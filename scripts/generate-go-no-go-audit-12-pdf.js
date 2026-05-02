const fs = require('fs');
const path = require('path');
const { jsPDF } = require('jspdf');
const autoTable = require('jspdf-autotable').default;

const outputPath = path.join(__dirname, '..', 'public', 'fixtray-go-no-go-audit-12.pdf');

const BRAND = {
  navy: [8, 14, 28],
  slate: [18, 40, 72],
  accent: [229, 51, 42],
  white: [255, 255, 255],
  text: [28, 34, 48],
  muted: [96, 112, 128],
  rowAlt: [246, 248, 252],
};

const gates = [
  {
    title: 'Gate 1 - Authentication and Session Security',
    rows: [
      {
        needed: 'Role login paths are stable',
        how: 'Verifies /api/auth/admin, /api/auth/shop, /api/auth/tech, /api/auth/customer all return valid tokens and role payloads.',
        go: 'All four role logins pass in staging and production with expected redirects.',
        noGo: 'Any role cannot log in or redirects to wrong dashboard.',
      },
      {
        needed: 'Refresh token lifecycle works',
        how: 'Validates refresh_id + refresh_sig cookies rotate and expired access tokens are renewed without forcing logout.',
        go: 'Token refresh succeeds and invalid/expired refresh tokens are rejected.',
        noGo: 'Users randomly drop sessions or refresh route returns 500/401 unexpectedly.',
      },
      {
        needed: 'Middleware authorization coverage',
        how: 'Checks route protection is server-side and includes admin/superadmin/shop/manager/tech/customer protected areas.',
        go: 'Unauthorized access attempts consistently return redirect or 401/403.',
        noGo: 'Any protected page is reachable without valid role authorization.',
      },
    ],
  },
  {
    title: 'Gate 2 - Subscription Gating and Plan Enforcement',
    rows: [
      {
        needed: 'Plan gate API is accurate',
        how: 'Checks /api/auth/subscription-gate returns allowed, status, plan, and feature flags from live DB state.',
        go: 'Returned plan/features match DB for shop, manager, and tech contexts.',
        noGo: 'Gate response mismatches DB or incorrectly allows blocked plans.',
      },
      {
        needed: 'UI + route feature lock alignment',
        how: 'Ensures sidebar/cards/tabs and direct URL navigation are enforced by same feature rules.',
        go: 'Locked feature is hidden in UI and blocked by middleware/API when URL is typed manually.',
        noGo: 'UI hides a feature but direct route still works, or vice versa.',
      },
      {
        needed: 'Plan limits enforced',
        how: 'Confirms max users, max shops, and plan capability checks are applied during create/update flows.',
        go: 'Over-limit actions are blocked with clear error and upgrade path.',
        noGo: 'Users exceed plan limits without restriction.',
      },
    ],
  },
  {
    title: 'Gate 3 - Payments and Stripe Reliability',
    rows: [
      {
        needed: 'Stripe environment complete',
        how: 'Validates STRIPE_SECRET_KEY, webhook secret, and all plan price/product IDs are set and non-placeholder.',
        go: 'Checkout session creation succeeds for each plan in test mode.',
        noGo: 'Any plan checkout throws missing env var or Stripe API error.',
      },
      {
        needed: 'Webhook integrity and idempotency',
        how: 'Confirms signature verification and duplicate event handling for subscription updates.',
        go: 'Duplicate webhooks do not corrupt subscription state and all valid events apply once.',
        noGo: 'Duplicate or delayed webhooks produce wrong status/plan in DB.',
      },
      {
        needed: 'Billing edge cases tested',
        how: 'Tests failed card, canceled checkout, upgrade, downgrade, cancellation, and reactivation transitions.',
        go: 'Each billing path ends in expected state with clear user messaging.',
        noGo: 'Any billing path leaves ambiguous or incorrect subscription state.',
      },
    ],
  },
  {
    title: 'Gate 4 - API Completeness and Route Integrity',
    rows: [
      {
        needed: 'Frontend API map has no dead endpoints',
        how: 'Cross-checks all fetch calls against existing route.ts files and removes path mismatches.',
        go: 'No 404 API calls during smoke test for all primary role journeys.',
        noGo: 'Any core user flow depends on missing route.',
      },
      {
        needed: 'Request/response contracts are stable',
        how: 'Checks payload validation and response schema consistency for read/write endpoints.',
        go: 'Validation errors are intentional, structured, and documented.',
        noGo: 'Payload shape drift causes frontend runtime breakage.',
      },
      {
        needed: 'Error code semantics are consistent',
        how: 'Verifies 400/401/403/404/409/500 usage is predictable across APIs.',
        go: 'Client can reliably interpret and display actionable errors.',
        noGo: 'Different endpoints return inconsistent status for same class of failure.',
      },
    ],
  },
  {
    title: 'Gate 5 - Data Integrity and Migration Safety',
    rows: [
      {
        needed: 'Migration path is production-safe',
        how: 'Validates migration runs against direct DB URL and rollback path is documented.',
        go: 'Migrations apply cleanly in staging clone and integrity checks pass.',
        noGo: 'Migration fails, blocks startup, or requires manual data repair.',
      },
      {
        needed: 'Critical relationships and constraints',
        how: 'Confirms required unique keys, foreign keys, and indexes exist for high-traffic entities.',
        go: 'No duplicate identity records and relational data remains consistent.',
        noGo: 'Broken relationships or duplicate key records observed.',
      },
      {
        needed: 'Backup and restore drill',
        how: 'Performs real restore to staging and validates key business records.',
        go: 'Restored data matches expected snapshots for shops, users, work orders, subscriptions.',
        noGo: 'Restore process fails or critical data is missing/corrupt.',
      },
    ],
  },
  {
    title: 'Gate 6 - Email, SMS, and Notification Delivery',
    rows: [
      {
        needed: 'Email provider operational',
        how: 'Verifies RESEND_API_KEY and sender domain deliver reset and transactional emails.',
        go: 'Password reset and transactional emails arrive with correct links/content.',
        noGo: 'Emails silently fail or link to invalid domain/port.',
      },
      {
        needed: 'SMS provider operational',
        how: 'Validates TWILIO_* credentials and sender fields used by code path.',
        go: '2FA and campaign SMS messages deliver in controlled test.',
        noGo: 'Twilio rejects due to missing from number or auth issues.',
      },
      {
        needed: 'Push notifications configured',
        how: 'Checks VAPID keys and subscription/send endpoints for browser push.',
        go: 'Subscription and send flows succeed on target devices.',
        noGo: 'Push subscribe/send fails in normal client flow.',
      },
    ],
  },
  {
    title: 'Gate 7 - Frontend UX and Mobile Behavior',
    rows: [
      {
        needed: 'Core workflows are responsive',
        how: 'Tests major pages on desktop/tablet/mobile breakpoints and verifies no blocked actions.',
        go: 'Primary user journeys complete on all supported viewport classes.',
        noGo: 'Any role is blocked on mobile or key screens overflow/break.',
      },
      {
        needed: 'Error/loading states are complete',
        how: 'Checks each async page has loading, empty, error, and retry handling.',
        go: 'No blank screens; users always have actionable state feedback.',
        noGo: 'Unhandled loading/error states leave users stuck.',
      },
      {
        needed: 'No console/runtime noise',
        how: 'Runs smoke suite and manual pass watching browser console and network failures.',
        go: 'No unhandled exceptions in core paths.',
        noGo: 'Persistent runtime errors or repeated failed requests appear.',
      },
    ],
  },
  {
    title: 'Gate 8 - Performance and Scale Baseline',
    rows: [
      {
        needed: 'Core endpoint latency baseline',
        how: 'Measures p95 latency for login, dashboard, work order create/update, and billing actions.',
        go: 'Latency is within defined target under expected launch load.',
        noGo: 'p95 exceeds target and user interactions feel degraded.',
      },
      {
        needed: 'Socket/realtime stability',
        how: 'Validates socket connection lifecycle, reconnect behavior, and event throughput.',
        go: 'Realtime pages remain stable over long sessions.',
        noGo: 'Frequent disconnects, stale data, or memory growth occur.',
      },
      {
        needed: 'DB and cache efficiency',
        how: 'Checks query hotspots, index coverage, and caching strategy for expensive reads.',
        go: 'No repeated high-cost queries in common flows.',
        noGo: 'N+1 patterns or unindexed filters impact launch traffic.',
      },
    ],
  },
  {
    title: 'Gate 9 - Security Hardening and Risk Controls',
    rows: [
      {
        needed: 'Secret hygiene and rotation',
        how: 'Replaces leaked/test credentials and verifies secrets are only in secure environment storage.',
        go: 'All production secrets are fresh and not present in repository history.',
        noGo: 'Any known leaked/placeholder secret remains active.',
      },
      {
        needed: 'Input/output protection checks',
        how: 'Validates sanitization, upload checks, and safe rendering for user-generated content.',
        go: 'No obvious XSS or unsafe file handling in tested paths.',
        noGo: 'Exploit vectors remain in public or authenticated pages.',
      },
      {
        needed: 'Security response readiness',
        how: 'Confirms incident response workflow and owner contacts are documented and tested.',
        go: 'Team can triage, contain, and communicate a security event quickly.',
        noGo: 'No clear response process or escalation path exists.',
      },
    ],
  },
  {
    title: 'Gate 10 - Observability and Operations',
    rows: [
      {
        needed: 'Monitoring and alerting live',
        how: 'Verifies Sentry, uptime checks, and alerts for 5xx/auth/payment/webhook failures.',
        go: 'Critical signals are visible and alerts route to active responders.',
        noGo: 'System can fail silently with no alerting path.',
      },
      {
        needed: 'Health endpoints are truthful',
        how: 'Checks health endpoints report integration and dependency status accurately.',
        go: 'Health checks reflect real service health and block launch when broken.',
        noGo: 'Health endpoint reports green while key integrations are failing.',
      },
      {
        needed: 'Rollback and runbooks',
        how: 'Confirms one-command rollback path and incident runbooks are current.',
        go: 'Team can revert bad release safely within agreed window.',
        noGo: 'Rollback is manual, untested, or undocumented.',
      },
    ],
  },
  {
    title: 'Gate 11 - Legal, Compliance, and Customer Trust',
    rows: [
      {
        needed: 'Policy visibility in-product',
        how: 'Checks Terms, Privacy, billing/refund terms, and contact info are reachable in user flows.',
        go: 'Policies are published, linked, and current for target market.',
        noGo: 'Required policies are missing or outdated at launch.',
      },
      {
        needed: 'Data handling commitments',
        how: 'Validates retention/deletion/export process is documented and operable.',
        go: 'Team can fulfill customer data requests end-to-end.',
        noGo: 'No enforceable process for data rights requests.',
      },
      {
        needed: 'Customer communication readiness',
        how: 'Ensures support channels and escalation path are visible and staffed.',
        go: 'Customers can reliably contact support and receive SLA-backed response.',
        noGo: 'No staffed support path at launch window.',
      },
    ],
  },
  {
    title: 'Gate 12 - Launch Day and First 72 Hours Control',
    rows: [
      {
        needed: 'Launch day command center',
        how: 'Defines freeze window, owners, communication channel, and immediate post-deploy smoke tests.',
        go: 'All owners active, smoke tests pass, and release is explicitly approved.',
        noGo: 'Critical smoke check fails or owner sign-off incomplete.',
      },
      {
        needed: 'Golden-path validation post deploy',
        how: 'Runs one complete real flow from signup/login to work order and payment confirmation.',
        go: 'End-to-end flow passes with evidence IDs and screenshots.',
        noGo: 'Any critical journey breaks after deployment.',
      },
      {
        needed: '72-hour stabilization watch',
        how: 'Tracks errors, auth failures, payments, webhooks, support tickets, and hotfix readiness.',
        go: 'No unresolved critical regressions and trends remain stable.',
        noGo: 'Critical regressions unresolved beyond agreed SLA.',
      },
    ],
  },
];

function addHeader(doc, pageNum) {
  doc.setFillColor(...BRAND.navy);
  doc.rect(0, 0, 842, 34, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...BRAND.white);
  doc.text('FixTray - Go/No-Go Audit (12 Gates)', 18, 22);

  doc.setFillColor(...BRAND.accent);
  doc.roundedRect(700, 8, 120, 18, 4, 4, 'F');
  doc.setFontSize(9);
  doc.text(`Page ${pageNum}`, 760, 20, { align: 'center' });
}

function addCover(doc) {
  doc.setFillColor(...BRAND.navy);
  doc.rect(0, 0, 842, 595, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(40);
  doc.setTextColor(...BRAND.white);
  doc.text('FixTray', 421, 148, { align: 'center' });

  doc.setFontSize(24);
  doc.text('Go / No-Go Audit in 12 Gates', 421, 188, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(13);
  doc.setTextColor(194, 208, 230);
  doc.text('Each gate explains what it does, how it works, and exact GO vs NO-GO criteria.', 421, 219, { align: 'center' });

  doc.setFillColor(...BRAND.slate);
  doc.roundedRect(112, 252, 618, 210, 10, 10, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...BRAND.white);
  doc.text('How to use this audit sheet', 140, 285);

  const notes = [
    '1) Assign an owner for every row (Engineering, Product, Ops, Support).',
    '2) Mark GO only when evidence is attached (test output, screenshot, log, or ticket link).',
    '3) Any NO-GO item in critical customer paths blocks launch.',
    '4) Final release decision requires cross-team sign-off.',
    `Generated: ${new Date().toLocaleString()}`,
  ];

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  let y = 315;
  for (const n of notes) {
    doc.text(n, 142, y);
    y += 30;
  }
}

function addLegend(doc) {
  doc.addPage('a4', 'landscape');
  addHeader(doc, 2);

  doc.setFillColor(...BRAND.slate);
  doc.rect(0, 44, 842, 30, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...BRAND.white);
  doc.text('Status and Evidence Legend', 18, 63);

  autoTable(doc, {
    startY: 84,
    head: [['Field', 'What to write', 'Minimum evidence required']],
    body: [
      ['GO', 'Requirement is complete and verified in target environment', 'Link to passing test run, screenshot, or log evidence'],
      ['NO-GO', 'Requirement is failed and blocks release', 'Bug ID + owner + ETA + mitigation'],
      ['BLOCKED', 'Cannot be completed due to external dependency', 'Dependency owner + unblock date + fallback plan'],
      ['Owner', 'Person accountable for final status', 'Name and team'],
      ['Evidence', 'Proof that check is actually complete', 'URL, ticket, screenshot, test artifact'],
    ],
    theme: 'grid',
    margin: { left: 18, right: 18 },
    styles: { fontSize: 10, cellPadding: 6, textColor: BRAND.text },
    headStyles: { fillColor: BRAND.navy, textColor: BRAND.white, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: BRAND.rowAlt },
    columnStyles: {
      0: { cellWidth: 110 },
      1: { cellWidth: 320 },
      2: { cellWidth: 376 },
    },
  });
}

function addGatePage(doc, gate, pageNum) {
  doc.addPage('a4', 'landscape');
  addHeader(doc, pageNum);

  doc.setFillColor(...BRAND.slate);
  doc.rect(0, 44, 842, 30, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...BRAND.white);
  doc.text(gate.title, 18, 63);

  const body = gate.rows.map((r, idx) => [
    String(idx + 1),
    r.needed,
    r.how,
    r.go,
    r.noGo,
    '',
    '',
  ]);

  autoTable(doc, {
    startY: 84,
    head: [['#', 'Needed Item', 'What It Does / How It Works', 'GO When', 'NO-GO When', 'Owner', 'Evidence']],
    body,
    theme: 'grid',
    margin: { left: 18, right: 18 },
    styles: {
      fontSize: 8.6,
      cellPadding: 4,
      textColor: BRAND.text,
      overflow: 'linebreak',
      valign: 'top',
    },
    headStyles: {
      fillColor: BRAND.navy,
      textColor: BRAND.white,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: BRAND.rowAlt,
    },
    columnStyles: {
      0: { cellWidth: 20, halign: 'center' },
      1: { cellWidth: 130 },
      2: { cellWidth: 220 },
      3: { cellWidth: 130 },
      4: { cellWidth: 130 },
      5: { cellWidth: 55 },
      6: { cellWidth: 85 },
    },
    didDrawPage: () => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...BRAND.muted);
      doc.text('FixTray Launch Control - Complete all required rows before release approval.', 18, 586);
    },
  });
}

function addFinalSignoff(doc, pageNum) {
  doc.addPage('a4', 'landscape');
  addHeader(doc, pageNum);

  doc.setFillColor(...BRAND.slate);
  doc.rect(0, 44, 842, 30, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...BRAND.white);
  doc.text('Final Go / No-Go Decision', 18, 63);

  autoTable(doc, {
    startY: 90,
    head: [['Role', 'Owner', 'Decision (GO / NO-GO)', 'Date/Time', 'Initials', 'Notes']],
    body: [
      ['Engineering Lead', '', '', '', '', ''],
      ['Product Lead', '', '', '', '', ''],
      ['Operations Lead', '', '', '', '', ''],
      ['Support Lead', '', '', '', '', ''],
      ['Security Reviewer', '', '', '', '', ''],
      ['Executive Approver', '', '', '', '', ''],
    ],
    theme: 'grid',
    margin: { left: 18, right: 18 },
    styles: { fontSize: 10, cellPadding: 8, textColor: BRAND.text },
    headStyles: { fillColor: BRAND.navy, textColor: BRAND.white, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: BRAND.rowAlt },
    columnStyles: {
      0: { cellWidth: 130 },
      1: { cellWidth: 115 },
      2: { cellWidth: 140 },
      3: { cellWidth: 100 },
      4: { cellWidth: 90 },
      5: { cellWidth: 231 },
    },
  });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...BRAND.accent);
  doc.text('Global Launch Outcome:', 18, 330);
  doc.setDrawColor(...BRAND.accent);
  doc.roundedRect(172, 314, 110, 24, 4, 4);
  doc.roundedRect(292, 314, 130, 24, 4, 4);
  doc.setTextColor(...BRAND.text);
  doc.text('GO', 227, 330, { align: 'center' });
  doc.text('NO-GO', 357, 330, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...BRAND.muted);
  doc.text('Release only if no blocking NO-GO remains in customer critical flows.', 18, 356);
}

const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
addCover(doc);
addLegend(doc);

let pageNum = 3;
for (const gate of gates) {
  addGatePage(doc, gate, pageNum++);
}

addFinalSignoff(doc, pageNum++);

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, Buffer.from(doc.output('arraybuffer')));
console.log(`Go/No-Go audit PDF written to ${outputPath}`);
