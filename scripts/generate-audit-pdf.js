const fs = require('fs');
const path = require('path');
const { jsPDF } = require('jspdf');
const autoTable = require('jspdf-autotable').default;

const outputPath = path.join(__dirname, '..', 'public', 'fixtray-full-audit.pdf');

// ─── Color palette ────────────────────────────────────────────────────────────
const C = {
  navyBg:    [18,  40,  72],
  redBg:     [180, 30,  30],
  orangeBg:  [200, 100, 0],
  yellowBg:  [160, 130, 0],
  greenBg:   [20,  100, 60],
  grayHeader:[60,  60,  70],
  white:     [255, 255, 255],
  lightGray: [245, 245, 248],
  offWhite:  [250, 250, 252],
  textDark:  [30,  30,  40],
  red:       [180, 30,  30],
  green:     [20,  100, 60],
  orange:    [180, 90,  0],
  blue:      [20,  70,  180],
};

// ─── Audit data ───────────────────────────────────────────────────────────────
const CATEGORIES = [
  {
    title: 'CRITICAL — Stripe Payment Configuration Broken',
    priority: 'CRITICAL',
    color: C.redBg,
    items: [
      {
        problem: 'All Stripe keys are placeholders — payments cannot be processed',
        why: '.env contains "sk_test_your_stripe_secret_key_here" and "pk_test_your_stripe_publishable_key_here" as values. These are dummy strings. When any subscription checkout is triggered, the Stripe SDK will reject the key immediately and throw a runtime error.',
        fix: '1. Create a Stripe account at stripe.com if not done yet.\n2. Copy your real test keys from Stripe Dashboard > Developers > API Keys.\n3. In .env set: STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY, STRIPE_WEBHOOK_SECRET.\n4. Run: node scripts/setup-stripe.js to auto-create all 5 plan products and prices.\n5. The script will print the 10 IDs — paste them into .env.',
        explanation: 'The Stripe checkout route (src/app/api/stripe/checkout/route.ts) reads STRIPE_SECRET_KEY to initialize the SDK and then reads per-plan price IDs from STRIPE_STARTER_PRICE_ID, STRIPE_GROWTH_PRICE_ID, STRIPE_PROFESSIONAL_PRICE_ID, STRIPE_BUSINESS_PRICE_ID, STRIPE_ENTERPRISE_PRICE_ID. The subscribe page (/shop/subscribe) calls POST /api/stripe/checkout which creates a Stripe Checkout Session and redirects the user to hosted Stripe payment page. After payment Stripe calls POST /api/stripe/webhook which flips the shop\'s Subscription record in the database to status=active and sets the plan. Without these keys: clicking "Subscribe" throws a 500, no subscription record is ever created, and the shop is permanently locked at the subscription gate.',
      },
      {
        problem: 'All 10 Stripe plan price/product IDs are missing from .env entirely',
        why: 'src/lib/stripe.ts exports STRIPE_PRODUCTS with a requireStripeId() guard that throws a hard JavaScript Error if any of the 10 env vars is undefined. This means the moment any code imports STRIPE_PRODUCTS and accesses a plan (e.g. stripe checkout, subscription suggestions), it throws: "Missing Stripe env var: STRIPE_STARTER_PRICE_ID".',
        fix: 'After running setup-stripe.js (above), add these to .env:\nSTRIPE_STARTER_PRODUCT_ID=prod_xxx\nSTRIPE_STARTER_PRICE_ID=price_xxx\n(repeat for: GROWTH, PROFESSIONAL, BUSINESS, ENTERPRISE)',
        explanation: 'STRIPE_PRODUCTS is used by: /api/stripe/checkout (creates session), /api/subscriptions/[shopId]/update-plan (upgrades/downgrades), /api/subscriptions/[shopId]/suggestions (shows upgrade nudges on subscribe page). Without IDs all three routes throw and the subscribe page cannot render plan cards with real pricing.',
      },
    ],
  },
  {
    title: 'CRITICAL — Email Sending Completely Broken',
    priority: 'CRITICAL',
    color: C.redBg,
    items: [
      {
        problem: 'RESEND_API_KEY is missing from .env — all emails silently fail',
        why: 'src/lib/emailService.ts checks for RESEND_API_KEY before calling the Resend API. When the key is absent it logs a warning and returns without sending. The .env file has Gmail SMTP variables (EMAIL_HOST, EMAIL_USER, EMAIL_PASS) but the codebase was migrated to Resend and no longer uses those SMTP vars. The SMTP config is dead code.',
        fix: '1. Sign up at resend.com (free tier sends 3,000 emails/month).\n2. Create an API key in the Resend dashboard.\n3. Add to .env:\n   RESEND_API_KEY=re_xxxxxxxxxxxx\n   RESEND_FROM_EMAIL=noreply@yourdomain.com\n4. Optionally remove the unused EMAIL_HOST/EMAIL_USER/EMAIL_PASS/EMAIL_SECURE vars to avoid confusion.',
        explanation: 'Emails affected by this outage: password reset emails (/api/auth/reset/request), estimate-ready customer notifications (/api/workorders/[id]), work order status update emails, customer invitation emails, recurring work order reminders (/api/cron/recurring-reminders), appointment reminders (/api/cron/appointment-reminders), team invitation emails, review request emails. The from address defaults to "onboarding@resend.dev" which is the Resend test sender — only works while API key is configured.',
      },
      {
        problem: 'Twilio env var name mismatch — SMS sending broken',
        why: '.env defines TWILIO_PHONE_NUMBER but code references process.env.TWILIO_FROM and process.env.TWILIO_FROM_NUMBER in two different places. Neither name matches what is in .env so both will be undefined at runtime and Twilio will throw "from" parameter missing.',
        fix: 'In .env rename TWILIO_PHONE_NUMBER to TWILIO_FROM:\n  TWILIO_FROM="+15551234567"\nAlso add:\n  TWILIO_FROM_NUMBER="+15551234567"\n  TWILIO_MESSAGING_SERVICE_SID=MGxxxxxxx (if using messaging service)\nBoth vars point to the same phone number — the code uses whichever it finds first.',
        explanation: 'SMS is used for: 2FA verification codes to technician phones, automated marketing campaign SMS blasts (/api/shop/campaigns), appointment reminder texts. The Twilio client is initialized in src/lib/twilio.ts using TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN (both present) but the "from" field in every sendSms call reads from TWILIO_FROM which is undefined.',
      },
    ],
  },
  {
    title: 'CRITICAL — Superadmin Pages Have Zero Server-Side Protection',
    priority: 'CRITICAL',
    color: C.redBg,
    items: [
      {
        problem: '/superadmin/* pages are NOT in the middleware matcher',
        why: 'src/middleware.ts config.matcher lists: /admin/:path*, /shop/:path*, /tech/:path*, /customer/:path*, /manager/:path*, /workorders/:path*, /reports/:path*. /superadmin is completely absent. This means Next.js never runs the auth middleware for any superadmin page. The only protection is a client-side useRequireAuth([\'superadmin\']) hook which runs AFTER the page JavaScript loads — meaning the page HTML and data fetches have already started.',
        fix: 'In src/middleware.ts add \'/superadmin/:path*\' to the matcher array:\n\nexport const config = {\n  matcher: [\n    \'/admin/:path*\',\n    \'/superadmin/:path*\',   // ADD THIS LINE\n    \'/shop/:path*\',\n    ...\n  ],\n};\n\nAlso add ROLE_ROLES entry: \'/superadmin\': [\'superadmin\']',
        explanation: 'Superadmin pages include: /superadmin/dashboard (all shops, all users counts), /superadmin/tenants (full tenant list with management actions), /superadmin/users (every user on the platform), /superadmin/security (security audit log), /superadmin/infrastructure (system health), /superadmin/analytics (platform-wide analytics). These pages call /api/admin/* routes which DO check auth — but without middleware, a non-logged-in user sees the page shell and loading states instead of a redirect to login. A logged-in shop owner hitting /superadmin/dashboard would see an empty page rather than an error.',
      },
    ],
  },
  {
    title: 'HIGH — 17 Frontend API Calls Have No Backend Route',
    priority: 'HIGH',
    color: C.orangeBg,
    items: [
      {
        problem: '/api/admin/email-templates — no route.ts file',
        why: 'The admin email templates page (/admin/email-templates) fetches this endpoint to load and save email templates. No route.ts exists under src/app/api/admin/email-templates. Every request returns a Next.js 404.',
        fix: 'Create src/app/api/admin/email-templates/route.ts.\nGET: return list of email templates from DB (or a JSON config file).\nPOST/PUT: save customized template content to DB.\nSchema: add EmailTemplate model to prisma/schema.prisma with fields: id, name, subject, htmlBody, updatedAt, shopId (null = global default).',
        explanation: 'Page: /admin/email-templates — allows platform admins to customize the HTML/text of system emails (password reset, work order notification, estimate ready). Without this route the page shows an empty list and saving does nothing. All emails continue using hardcoded templates in emailService.ts.',
      },
      {
        problem: '/api/admin/security — no route.ts (real path is /api/security/events)',
        why: 'The admin security settings page calls /api/admin/security but the actual route file is at src/app/api/security/events/route.ts. The paths do not match so the admin page gets a 404.',
        fix: 'Two options:\n  A) Rename the existing route to match: move src/app/api/security/events/route.ts to src/app/api/admin/security/route.ts\n  B) Add a redirect/proxy: in the admin security page change the fetch URL from /api/admin/security to /api/security/events',
        explanation: 'The security events route returns platform-wide security audit entries: login attempts, failed authentications, role changes, suspicious activity flags. The admin security page (/admin/security-settings) displays these as a log table with filter by event type and date range.',
      },
      {
        problem: '/api/admin/sessions — no route.ts (real path is /api/auth/sessions)',
        why: 'The admin sessions page and the admin dashboard both call /api/admin/sessions but the route is at /api/auth/sessions. Path mismatch causes 404.',
        fix: 'In the admin sessions page change fetch URL from /api/admin/sessions to /api/auth/sessions.\nAlternatively create a thin wrapper at /api/admin/sessions that proxies to /api/auth/sessions with admin-level permissions (letting admin see all sessions, not just their own).',
        explanation: 'The sessions route returns active login tokens. The admin view should show all active sessions across all users for security monitoring. The current /api/auth/sessions route only returns sessions for the authenticated user — an admin wrapper route would need to query all refreshToken records with pagination.',
      },
      {
        problem: '/api/admin/tools — no route.ts',
        why: 'The /admin/admin-tools page fetches /api/admin/tools for a list of runnable admin utilities. No route file exists.',
        fix: 'Create src/app/api/admin/tools/route.ts.\nGET: return list of available admin tools (db cleanup, cache flush, re-index, etc.).\nPOST: accept { tool: string, params: object } to execute a specific tool.\nProtect with admin role check.',
        explanation: 'Page: /admin/admin-tools — intended to give platform admins a UI to run maintenance tasks without SSH access: clear Redis cache, trigger manual cron jobs, re-run database migrations, flush rate limit counters. Without the route the page shows empty and buttons do nothing.',
      },
      {
        problem: '/api/appointments/recurring — no route.ts',
        why: 'The appointments page calls /api/appointments/recurring to load recurring appointment templates. Only /api/appointments and /api/appointments/[id] exist. There is no recurring sub-route.',
        fix: 'Create src/app/api/appointments/recurring/route.ts.\nGET: return appointments where recurrence !== null or a RecurringAppointment model.\nPOST: create a new recurring appointment template.\nDELETE: remove recurring template and optionally all future instances.',
        explanation: 'Recurring appointments allow customers to book repeating service slots (e.g. monthly oil changes). The page /customer/appointments would show a "Recurring" tab listing these. The recurring appointment model would need: customerId, shopId, serviceType, frequency (weekly/monthly), dayOfWeek/dayOfMonth, nextOccurrence, status.',
      },
      {
        problem: '/api/auth/forgot-password — no route.ts (real path is /api/auth/reset/request)',
        why: 'Some pages link to or fetch /api/auth/forgot-password but the password reset route is at /api/auth/reset/request. A 404 is returned.',
        fix: 'Two options:\n  A) Create src/app/api/auth/forgot-password/route.ts that imports and re-exports the handler from reset/request\n  B) Find every reference to /api/auth/forgot-password in the codebase and change them to /api/auth/reset/request\nOption B is cleaner.',
        explanation: 'The password reset flow: user enters email on /auth/reset page -> POST /api/auth/reset/request sends a reset code via Resend -> user receives email with token -> user submits token and new password to POST /api/auth/reset/confirm. The "forgot-password" name is a legacy leftover from an earlier version.',
      },
      {
        problem: '/api/manager/estimates — no route.ts',
        why: 'The manager estimates page (/manager/estimates) fetches this endpoint to load pending customer estimates that need manager review. No route file exists under src/app/api/manager.',
        fix: 'Create src/app/api/manager/estimates/route.ts.\nGET: query WorkOrder/Estimate records where shopId = token.shopId and status = \'estimate_pending\'\nPOST: approve or reject an estimate with notes\nFilter by the managersShopId from the JWT token.',
        explanation: 'Page: /manager/estimates — shows the manager a list of estimates waiting for approval before being sent to the customer. Columns: customer name, vehicle, line items, total, submitted by (tech), date. Manager can approve (triggers customer email), request changes (sends note back to tech), or reject. Without this route the page shows nothing.',
      },
      {
        problem: '/api/manager/performance — no route.ts',
        why: 'Manager reports page calls /api/manager/performance which does not exist. The shop-owner equivalent is /api/analytics/employee-performance.',
        fix: 'Create src/app/api/manager/performance/route.ts that queries tech performance metrics scoped to the manager\'s shopId from JWT.',
        explanation: 'Page: /manager/reports — performance metrics for the manager\'s shop: completed jobs per tech, average job duration, comeback rate, parts markup, customer satisfaction scores. All data already exists in the database via WorkOrder, TimeTracking, and Review tables — the route just needs to aggregate it.',
      },
      {
        problem: '/api/manager/schedule — no route.ts',
        why: 'Manager schedule page calls this endpoint. The shop-equivalent schedule routes exist at /api/shop/schedule and /api/shop/team-schedule but there is no manager-scoped version.',
        fix: 'Create src/app/api/manager/schedule/route.ts.\nGET: return schedule entries for the manager\'s shop (scoped by shopId from JWT).\nPOST: create/update schedule blocks.\nThis is effectively a proxy to the existing shop/schedule logic with a role check for manager.',
        explanation: 'Page: /manager/schedule — the manager\'s view of the shop schedule: who is working which shifts, bay assignments, appointments blocked on the calendar. Data comes from the ShopSchedule and Appointment models. The manager needs the same data as the shop owner but the JWT role is \'manager\' not \'shop\' so the /api/shop/schedule route may reject the token.',
      },
      {
        problem: '/api/user/permissions — no route.ts',
        why: 'Some settings pages call /api/user/permissions to load the current user\'s permission set. The real permissions route is /api/permissions which handles shop-level permission templates — not individual user permissions.',
        fix: 'Create src/app/api/user/permissions/route.ts.\nGET: return the permission flags for the authenticated user (from Tech.permissions or a PermissionSet record).\nThis should be scoped to the token\'s id and role.',
        explanation: 'This is used in permission-checking logic on settings pages where the UI conditionally shows/hides actions based on what the logged-in user is allowed to do (e.g. can_void_invoices, can_edit_customer, can_manage_inventory). Without this route permission checks default to showing everything or nothing depending on the fallback logic.',
      },
      {
        problem: '/api/mdm/unenroll — no route.ts',
        why: 'The MDM mobile device management page has an unenroll button that calls DELETE /api/mdm/unenroll. Only /api/mdm/enroll and /api/mdm/commands exist.',
        fix: 'Create src/app/api/mdm/unenroll/route.ts.\nDELETE: remove the device record for the given deviceId from the MDM enrollment table, revoke push notification token, clear geolocation tracking for that device.',
        explanation: 'MDM (Mobile Device Management) is used to manage tech phones: push silent commands, get GPS location, wipe app data on termination. The unenroll endpoint is called when a technician leaves the company or a device is replaced. Without it enrolled devices cannot be removed from the system.',
      },
      {
        problem: '/api/tech/complete — no route.ts',
        why: 'The tech home page has a "Mark Complete" button that calls PATCH /api/tech/complete. No such route exists.',
        fix: 'Create src/app/api/tech/complete/route.ts.\nPATCH: accept { workOrderId } in body. Update WorkOrder status to \'completed\', set completedAt, set assignedTechId, trigger customer notification email.',
        explanation: 'This is the technician\'s quick-complete action from their home dashboard job card. It differs from the full edit flow (/api/workorders/[id]) because it is a one-tap action with no form — just marks the job done and notifies the customer. Without this route the button fails silently and jobs stay in-progress.',
      },
    ],
  },
  {
    title: 'HIGH — Subscription Enforcement Gaps',
    priority: 'HIGH',
    color: C.orangeBg,
    items: [
      {
        problem: 'Manager and tech page routes are NOT middleware-gated by subscription',
        why: 'The middleware only runs the subscription gate check when role === \'shop\'. Manager and tech tokens carry a shopId so they can be gated too — but they are not. A manager on a Starter-plan shop can navigate directly to /manager/payroll in the browser and nothing stops them at the server level. Only the Sidebar UI hides the link.',
        fix: 'In src/middleware.ts extend the subscription check to also cover role === \'manager\' and role === \'tech\':\n\nif ([\'shop\', \'manager\', \'tech\'].includes(role)) {\n  // run subscription gate check\n  // if feature locked: redirect manager to /manager/home?reason=feature_locked\n  //                    redirect tech to /tech/home?reason=feature_locked\n}\n\nThe gate API already handles manager/tech tokens correctly (returns the shop\'s plan).',
        explanation: 'A shop owner on Starter plan who creates a manager account — that manager can bypass the UI restrictions by typing /manager/payroll directly in the address bar. The middleware check ensures a server-side redirect happens before any page data loads, regardless of what the Sidebar shows.',
      },
      {
        problem: 'breakTracking (GPS/time break features) not gated — Starter users can access it',
        why: 'subscription.ts sets breakTracking: false for Starter plan. But no route in subscription-access.ts maps to the breakTracking feature. The timeclock pages (/shop/timeclock, /tech/timeclock, /manager/timeclock) are freely accessible on all plans.',
        fix: 'In src/lib/subscription-access.ts add to ROUTE_FEATURE_RULES:\n  { prefix: \'/shop/timeclock\', feature: \'breakTracking\' },\n  { prefix: \'/tech/timeclock\', feature: \'breakTracking\' },\n  { prefix: \'/manager/timeclock\', feature: \'breakTracking\' },\n\nNote: basic clock-in/out is a core feature — consider using timeTracking as the gate key (which is true on all plans) and only gating the break-specific sub-routes under breakTracking.',
        explanation: 'The timeclock system tracks punch-in, punch-out, and break periods for payroll. The breakTracking feature flag specifically controls whether technicians can log paid/unpaid breaks. On Starter (1 user) this is less critical, but on Growth it becomes part of payroll compliance. Currently a Starter user sees the full break UI.',
      },
      {
        problem: 'gpsVerification not gated — Starter users can use tech share-location',
        why: 'subscription.ts sets gpsVerification: false for Starter. No rule in subscription-access.ts covers /tech/share-location so it is openly accessible.',
        fix: 'In src/lib/subscription-access.ts add:\n  { prefix: \'/tech/share-location\', feature: \'gpsVerification\' },\n  { prefix: \'/api/tech/tracking\', feature: \'gpsVerification\' },',
        explanation: 'GPS verification lets the shop owner see live technician locations on a map and verify that field techs are at job sites. The tech share-location page (/tech/share-location) posts GPS coordinates to /api/tech/tracking. On Starter (single user, single shop) this feature is disabled — it is part of the Growth multi-tech management suite.',
      },
      {
        problem: 'realTimeDashboards not gated — live dashboard accessible on Starter',
        why: 'subscription.ts sets realTimeDashboards: false for Starter. The real-time shop home dashboard (/shop/home) and socket-based updates are available to all plans with no check.',
        fix: 'Consider whether /shop/home should be fully blocked on Starter or just the real-time socket features. Recommended approach:\n  - Gate /shop/admin/health (already done via advancedReporting)\n  - Add a socket connection guard in the home page: only initiate socket.io connection if subscriptionFeatures.realTimeDashboards === true\n  - Show a static dashboard for Starter — same data but polled every 60s instead of live',
        explanation: 'Real-time dashboards use socket.io (socket-server.js) to push live work order status changes, tech location pings, and urgent alerts to the shop home screen. On Starter this creates unnecessary server load for single-user shops. The data is the same — only the delivery mechanism (live vs. polled) should differ by plan.',
      },
    ],
  },
  {
    title: 'HIGH — Environment Variable Mismatches',
    priority: 'HIGH',
    color: C.orangeBg,
    items: [
      {
        problem: 'DATABASE_URL and DATABASE_URL_UNPOOLED are identical',
        why: 'Neon PostgreSQL provides two connection strings: a pooled URL (for app runtime — uses PgBouncer) and an unpooled URL (for migrations — direct connection required). Both are set to the same pooled URL. Running migrations through a pooler can cause "prepared statements" errors and connection limit issues.',
        fix: 'In the Neon dashboard go to your project > Connection Details.\nCopy the "Direct connection" URL (contains no "-pooler" in the hostname).\nSet DATABASE_URL_UNPOOLED to that direct URL.\nDATABASE_URL should keep the pooled URL.\n\nExample:\nDATABASE_URL="...pooler.neon.tech/neondb?pgbouncer=true"\nDATABASE_URL_UNPOOLED="...neon.tech/neondb" (no pooler)',
        explanation: 'The Prisma schema.prisma has directUrl = env("DATABASE_URL_UNPOOLED") which Prisma uses for schema migrations and introspection. During npm run db:migrate Prisma will use the direct URL to run DDL statements. PgBouncer does not support session-mode statements required by Prisma migrations — using the pooler for migrations causes intermittent failures especially under load.',
      },
      {
        problem: 'NEXT_PUBLIC_APP_URL = http://localhost:3000 but dev server runs on port 3001',
        why: 'The dev server is configured (SOCKET_PORT=3001 and next dev starts on 3001) but the public URL env var still points to port 3000. Any code that constructs absolute URLs using NEXT_PUBLIC_APP_URL (payment callbacks, email links, webhook URLs) will generate links to the wrong port.',
        fix: 'In .env change:\n  NEXT_PUBLIC_APP_URL="http://localhost:3001"\nAlso update NEXT_PUBLIC_APP_URL_PRODUCTION to your real domain before deploying.',
        explanation: 'Affected places: Stripe success/cancel redirect URLs in /api/stripe/checkout (currently builds http://localhost:3000/shop/settings which doesn\'t load on dev), password reset links in emails (broken localhost link in dev), DVI inspection approval links, work authorization token links. In production this should be set to https://yourdomain.com.',
      },
      {
        problem: 'Push notifications will not work — 3 VAPID keys missing from .env',
        why: 'Web Push requires a VAPID key pair (public + private) plus a contact email. The code references process.env.VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_EMAIL, and NEXT_PUBLIC_VAPID_PUBLIC_KEY. None of these are in .env.',
        fix: 'Generate VAPID keys once:\n  npx web-push generate-vapid-keys\nAdd to .env:\n  VAPID_PUBLIC_KEY=BAxxx...\n  VAPID_PRIVATE_KEY=xxx...\n  VAPID_EMAIL=mailto:admin@yourdomain.com\n  NEXT_PUBLIC_VAPID_PUBLIC_KEY=BAxxx... (same as VAPID_PUBLIC_KEY)\nAlso update public/manifest.json if it references the VAPID key.',
        explanation: 'Push notifications are used across the app: new work order assigned (tech), customer message received (shop), appointment reminder (customer), urgent alert (shop home). The service worker (public/sw.js) subscribes using NEXT_PUBLIC_VAPID_PUBLIC_KEY. /api/push/subscribe stores the subscription endpoint in the database. /api/push/send sends the notification. Without VAPID keys the subscription call fails and no notifications are ever delivered.',
      },
      {
        problem: 'NEXT_PUBLIC_SOCKET_URL missing — socket.io client cannot connect',
        why: 'The client-side socket.io initialization reads process.env.NEXT_PUBLIC_SOCKET_URL to know what server to connect to. This env var is not in .env. Without it the socket client likely falls back to window.location.origin (same-origin) which works in development but fails in production where the socket server runs on a different port or service.',
        fix: 'Add to .env:\n  NEXT_PUBLIC_SOCKET_URL=http://localhost:3001\nIn production this should be your socket server URL (same domain or separate subdomain).',
        explanation: 'The socket server (socket-server.js) runs separately from Next.js. Real-time features depend on the client connecting to it: live work order status updates on shop home, tech GPS pings, urgent alerts, waiting room screen, live chat. When NEXT_PUBLIC_SOCKET_URL is undefined in production the client tries the Next.js server port which has no socket.io handler and silently fails.',
      },
      {
        problem: 'Cloudinary client-side upload vars missing',
        why: '.env has server-side CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET but the browser-side upload widget needs NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET. These are absent.',
        fix: 'In .env add:\n  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name (same value as CLOUDINARY_CLOUD_NAME)\n  NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_unsigned_preset\nCreate an unsigned upload preset in Cloudinary Dashboard > Settings > Upload Presets.',
        explanation: 'Client-side Cloudinary uploads (photos from the DVI page, condition reports, work order attachments) use the Cloudinary Upload Widget or direct fetch to the Cloudinary API. These require the cloud name and an unsigned preset — not the API secret (which must never be in client code). Without these vars photo uploads from the browser show an error or are silently dropped.',
      },
    ],
  },
  {
    title: 'MEDIUM — Auth & Token Inconsistencies',
    priority: 'MEDIUM',
    color: C.yellowBg,
    items: [
      {
        problem: 'Double admin login attempt on every single login — performance issue and confusing logs',
        why: 'LoginClient.tsx tries /api/auth/admin first. If it returns 404, it immediately retries with /api/admin/login. This means every non-admin login attempt (shops, techs, customers) makes TWO requests to admin endpoints before moving on. The logs show spurious 404 errors for every login.',
        fix: 'Remove the fallback. Decide on one admin login endpoint and use only that.\nRecommended: keep /api/auth/admin (consistent with other auth routes) and delete /api/admin/login or have it redirect to /api/auth/admin.',
        explanation: 'The double-attempt pattern was added when the admin login route was moved, as a backwards-compatibility shim. Since both routes now exist it creates unnecessary network traffic. For a shop with 20 techs logging in throughout the day that is 40 extra requests per day just for the login fallback.',
      },
      {
        problem: 'Manager login goes through /api/auth/tech — undocumented and fragile',
        why: 'Managers are stored in the Tech table with role=\'manager\'. The /api/auth/tech route returns whatever role is in the Tech record. This works but is conceptually confusing: manager auth flows through a "tech" endpoint, and if the Tech table is ever split into Manager and Tech tables the login will silently break.',
        fix: 'No immediate code change needed — document this clearly. Long term: create /api/auth/manager that queries the same Tech table but filters for role IN [\'manager\']:',
        explanation: 'The JWT returned from /api/auth/tech includes role: techData.role which will be \'manager\' or \'tech\' based on the DB record. LoginClient.tsx checks techData.role after a successful response to decide which home page to route to. This works correctly today but the coupling to the tech endpoint is a maintenance risk.',
      },
      {
        problem: 'Customer login token field inconsistency — dead code fallback',
        why: 'The customer login route (/api/auth/customer) returns { accessToken: "..." }. LoginClient.tsx reads it as: customerData.token || customerData.accessToken || customerData.access_token. The primary check is customerData.token which is never set — the real field is accessToken. The fallbacks are dead code from previous API versions.',
        fix: 'In LoginClient.tsx change customer token extraction to:\n  const token = customerData.accessToken;\nRemove the || customerData.token || customerData.access_token fallbacks.',
        explanation: 'This is a latent bug: if anyone ever adds a token field to the customer login response with a different value, the wrong token will be used. Clean code eliminates ambiguity.',
      },
    ],
  },
  {
    title: 'MEDIUM — Pages Without API Backing (Placeholder / Stub Pages)',
    priority: 'MEDIUM',
    color: C.yellowBg,
    items: [
      {
        problem: '/superadmin/deployments — no API, shows static/mock content',
        why: 'The deployments page renders hardcoded deployment cards with no real data. There is no /api/superadmin/deployments route.',
        fix: 'Either:\n  A) Build a real deployment tracking API that reads from a deployment log table\n  B) Mark the page as "Coming Soon" with a placeholder UI to avoid user confusion\n  C) Link to an external deployment dashboard (Vercel, Railway)',
        explanation: 'This page would show: recent deploys (commit hash, branch, timestamp, status), rollback controls, environment health. Without a real API this page is misleading — it shows fake data that looks real.',
      },
      {
        problem: '/superadmin/infrastructure — hardcoded mock system health data',
        why: 'The infrastructure monitoring page fetches no real data. CPU, memory, and uptime values are hardcoded.',
        fix: 'Connect to the existing /api/admin/health endpoint which already checks: database connectivity, Resend config, Stripe config, Redis config. Extend it with real system metrics or integrate a monitoring tool (Datadog, Better Uptime).',
        explanation: 'Page: /superadmin/infrastructure — meant to show server health: database connection status, cache hit rate, active socket connections, memory usage, job queue depth. The /api/admin/health route already has a partial implementation.',
      },
      {
        problem: '/tech/diagnostics and /tech/manuals — no API, static pages',
        why: 'These tech tool pages have no backend data source.',
        fix: '/tech/diagnostics: connect to /api/dtc-lookup which already exists for DTC code lookup.\n/tech/manuals: either connect to a vehicle database API (AllData, Mitchell1) via an integration, or allow shops to upload PDFs via Cloudinary and display them here.',
        explanation: 'Tech diagnostics (/tech/diagnostics) is meant to give techs real-time vehicle diagnostic data. Manuals (/tech/manuals) gives access to repair procedures. These are Growth+ features (tied to photoCapture and advancedReporting flags). Currently both pages render empty or with placeholder text.',
      },
    ],
  },
  {
    title: 'HIGH — LAUNCH READINESS (What Still Must Be Done For 100% Client Go-Live)',
    priority: 'HIGH',
    color: C.orangeBg,
    items: [
      {
        problem: 'No formal Go/No-Go launch gate exists yet',
        why: 'Even if code issues are fixed, launch quality still fails when there is no final pass/fail gate. Teams end up launching with unknown regressions because there is no owner-approved checklist that proves core journeys work in production-like conditions.',
        fix: 'Create a release gate document with 4 states per check: Not Started, In Progress, Passed, Failed. Require all checks to be Passed before launch. Block launch if any CRITICAL/HIGH issue is Failed. Assign one owner per section (Product, Engineering, QA, Operations).',
        explanation: 'This should be a single source of truth for launch readiness. Suggested sections: Core User Journeys, Payments & Billing, Auth & Access, Notifications, Data & Recovery, Security, Monitoring, Legal/Compliance, Support Readiness. Each section must have evidence links (test run screenshots, logs, Stripe test transaction IDs, webhook event IDs).',
      },
      {
        problem: 'Core end-to-end user journeys are not fully validated in one production-like run',
        why: 'Feature-level testing is not enough. Real users fail when multiple services interact (auth + payments + email + DB + webhooks). Without an end-to-end pass, hidden integration bugs ship to customers.',
        fix: 'Run one full "golden path" test in staging and record results for each role:\n1) Shop signup -> approval -> subscription checkout\n2) Shop login -> create work order -> assign tech\n3) Tech login -> update job -> mark complete\n4) Customer receives notification -> approves work -> pays invoice\n5) Manager flow (if enabled) -> reports/schedule actions\nCapture screenshots and IDs for every step.',
        explanation: 'Pages and endpoints touched in this flow include: /auth/login, /shop/subscribe, /shop/admin, /workorders/new, /tech/home, /customer/workorders/[id], /payment/success plus APIs such as /api/auth/shop, /api/stripe/checkout, /api/workorders, /api/workorders/[id], /api/workorders/payment, /api/stripe/webhook. This proves the full business lifecycle works for paying customers.',
      },
      {
        problem: 'Production environment is not fully configured and verified',
        why: 'Missing or placeholder env vars cause silent partial outages (emails off, Stripe off, sockets off) that are often discovered only by live customers.',
        fix: 'Build a deployment-time environment validation step:\n1) Add startup checks that fail hard for required vars in production\n2) Verify Stripe keys and plan IDs\n3) Verify RESEND_API_KEY/RESEND_FROM_EMAIL\n4) Verify VAPID keys\n5) Verify NEXT_PUBLIC_SOCKET_URL\n6) Verify DATABASE_URL vs DATABASE_URL_UNPOOLED\n7) Verify webhook secrets and callback URLs',
        explanation: 'Use /api/admin/health as a base and expand it into a launch blocker endpoint: if any required integration is missing, return status=failed with explicit missing keys. Expose this on /admin/system-settings so you can confirm readiness before opening access to customers.',
      },
      {
        problem: 'Security readiness is incomplete for production customer traffic',
        why: 'Customer launch increases attack surface immediately. Missing middleware coverage, weak secret handling, or incomplete authorization checks can expose sensitive data and cause account compromise.',
        fix: 'Before launch complete this security minimum:\n1) Add /superadmin/:path* to middleware matcher\n2) Enforce server-side role checks on all admin/superadmin routes\n3) Enforce subscription checks for manager/tech where required\n4) Confirm CSRF token validation on state-changing endpoints\n5) Rotate leaked/test secrets and generate fresh production secrets\n6) Verify rate limits on login/reset/payment endpoints\n7) Confirm no sensitive data is logged (tokens, passwords, card data)',
        explanation: 'Key endpoints to retest with unauthorized tokens: /api/admin/*, /api/superadmin/* (if added), /api/shop/*, /api/workorders/*, /api/payment/*, /api/stripe/webhook. Expected behavior: 401/403 for unauthorized requests and no leakage in response payloads.',
      },
      {
        problem: 'Monitoring, alerting, and incident response are not fully operationalized',
        why: 'Without active monitoring, failures can run for hours before anyone notices. Early customers experience outages first and lose trust quickly.',
        fix: 'Set up launch-day monitoring baseline:\n1) Enable Sentry with real DSN and release tags\n2) Add uptime checks for app + API + socket server\n3) Add alerts for payment webhook failures, email failures, 5xx spikes\n4) Log correlation IDs for request tracing\n5) Create an incident runbook with owner contacts and rollback steps',
        explanation: 'Minimum pages/endpoints to monitor: landing and login pages, /shop/admin, /api/health, /api/admin/health, /api/stripe/webhook, /api/auth/* login routes, and socket connection success rate. This gives immediate visibility into customer-facing failures.',
      },
      {
        problem: 'Data integrity, backup, and recovery are not proven end-to-end',
        why: 'A product is not customer-ready unless you can recover from mistakes and outages. Backup jobs that were never restore-tested are effectively untrusted.',
        fix: 'Run a backup/restore drill before launch:\n1) Create a backup snapshot\n2) Restore to a staging database\n3) Validate key tables: Shop, Subscription, WorkOrder, Customer, RefreshToken\n4) Confirm migrated schema version matches production\n5) Document RPO/RTO and communicate internally\nAlso verify webhook idempotency for Stripe events to prevent duplicate billing state changes.',
        explanation: 'The admin backup area and APIs (e.g., /api/admin/backup where implemented) should support operational recovery. In customer terms: this ensures their work orders, invoices, and subscriptions are not lost after an incident.',
      },
      {
        problem: 'Customer trust/compliance artifacts are incomplete or not enforced in UX',
        why: 'Launching without visible policies and consent checkpoints increases legal and reputational risk, especially when handling customer PII and payment data.',
        fix: 'Before launch verify:\n1) Privacy policy and Terms are current and linked in auth/signup flows\n2) Data retention and deletion process is documented\n3) Consent text exists for marketing notifications\n4) Billing/refund policy is visible on subscription pages\n5) Contact/support channels are visible in-app',
        explanation: 'Relevant pages to verify: /pricing, /auth/register/*, /contact, customer signup/payment flows, and footer links in public-facing pages. These elements reduce disputes and support burden after launch.',
      },
      {
        problem: 'Support and operations readiness for first customers is not finalized',
        why: 'Even if the app works, the first real users will need help. Without support workflows, issues stay unresolved and churn increases immediately.',
        fix: 'Create first-30-days support operations:\n1) Define support SLA targets (response and resolution)\n2) Create triage labels (billing, auth, work order, mobile, integration)\n3) Prepare canned responses and troubleshooting steps\n4) Ensure admin tools needed for support are functional\n5) Add account recovery and password-reset fallback procedures',
        explanation: 'At minimum, support staff should be able to verify account status, subscription state, payment events, and login/session issues quickly using admin pages and logs. This is essential for retaining early customers.',
      },
    ],
  },
];

function getSummaryRows(categories) {
  const counts = categories.reduce((acc, cat) => {
    const key = cat.priority || 'OTHER';
    acc[key] = (acc[key] || 0) + cat.items.length;
    return acc;
  }, {});

  const rows = [];
  if (counts.CRITICAL) rows.push(['CRITICAL', `${counts.CRITICAL} issues`, C.red]);
  if (counts.HIGH) rows.push(['HIGH', `${counts.HIGH} issues`, C.orange]);
  if (counts.MEDIUM) rows.push(['MEDIUM', `${counts.MEDIUM} issues`, C.yellowBg]);
  return rows;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function addPageHeader(doc, pageNum, totalPages) {
  // Dark top bar
  doc.setFillColor(...C.navyBg);
  doc.rect(0, 0, 595, 28, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...C.white);
  doc.text('FixTray — Full System Audit Report', 14, 18);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Page ${pageNum}`, 560, 18, { align: 'right' });
}

function addCover(doc) {
  // full page gradient-style bg using two rects
  doc.setFillColor(...C.navyBg);
  doc.rect(0, 0, 595, 842, 'F');

  doc.setFillColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(34);
  doc.setTextColor(255, 255, 255);
  doc.text('FixTray', 297, 220, { align: 'center' });

  doc.setFontSize(22);
  doc.text('Full System Audit Report', 297, 260, { align: 'center' });

  doc.setFontSize(12);
  doc.setTextColor(180, 200, 230);
  doc.text('Problem · Why It\'s Wrong · How to Fix · What It Affects', 297, 295, { align: 'center' });

  doc.setFontSize(10);
  doc.setTextColor(140, 160, 200);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 297, 330, { align: 'center' });

  // Summary box
  doc.setFillColor(255, 255, 255, 0.08);
  doc.setFillColor(30, 55, 100);
  doc.roundedRect(80, 380, 435, 160, 6, 6, 'F');

  const summary = getSummaryRows(CATEGORIES);
  let sy = 420;
  for (const [label, count, color] of summary) {
    doc.setFillColor(...color);
    doc.roundedRect(100, sy - 12, 60, 18, 3, 3, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...C.white);
    doc.text(label, 130, sy, { align: 'center' });
    doc.setFontSize(11);
    doc.setTextColor(220, 230, 250);
    doc.text(count, 220, sy);
    sy += 36;
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(140, 160, 200);
  doc.text('Areas covered: API routes · Auth · Env vars · Subscriptions · Missing endpoints · Security', 297, 560, { align: 'center' });
}

function addToc(doc, categories) {
  doc.addPage();
  addPageHeader(doc, 2, '?');

  let y = 50;
  doc.setFillColor(...C.navyBg);
  doc.rect(14, y, 567, 26, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...C.white);
  doc.text('Table of Contents', 297, y + 17, { align: 'center' });
  y += 38;

  for (let i = 0; i < categories.length; i++) {
    const cat = categories[i];
    const pColor = cat.priority === 'CRITICAL' ? C.red : cat.priority === 'HIGH' ? C.orange : C.yellowBg;

    // Priority badge
    doc.setFillColor(...pColor);
    doc.roundedRect(14, y - 10, 55, 14, 3, 3, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...C.white);
    doc.text(cat.priority, 41, y, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...C.textDark);
    doc.text(`${i + 1}.  ${cat.title}`, 78, y);

    doc.setDrawColor(200, 200, 210);
    doc.setLineWidth(0.3);
    doc.line(14, y + 5, 581, y + 5);
    y += 22;

    if (y > 780) {
      doc.addPage();
      addPageHeader(doc, '?', '?');
      y = 50;
    }
  }
}

function renderIssue(doc, item, index, yStart) {
  let y = yStart;
  const PAGE_H = 842;
  const MARGIN_BOTTOM = 40;
  const LEFT = 14;
  const RIGHT = 581;
  const WIDTH = RIGHT - LEFT;

  function checkPage(neededHeight) {
    if (y + neededHeight > PAGE_H - MARGIN_BOTTOM) {
      doc.addPage();
      addPageHeader(doc, '?', '?');
      y = 45;
    }
    return y;
  }

  // Issue number + label bar
  checkPage(22);
  doc.setFillColor(240, 240, 248);
  doc.rect(LEFT, y, WIDTH, 18, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 80);
  doc.text(`Issue ${index}`, LEFT + 4, y + 12);
  y += 24;

  // ── PROBLEM ──
  const sections = [
    { label: '⚑  PROBLEM',   bgColor: C.redBg,    text: item.problem },
    { label: '?  WHY IT\'S WRONG', bgColor: C.orangeBg, text: item.why },
    { label: '✓  HOW TO FIX',  bgColor: C.greenBg,  text: item.fix },
    { label: '?  EXPLANATION', bgColor: C.grayHeader, text: item.explanation },
  ];

  for (const sec of sections) {
    // header row
    checkPage(18);
    doc.setFillColor(...sec.bgColor);
    doc.rect(LEFT, y, WIDTH, 16, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...C.white);
    doc.text(sec.label, LEFT + 5, y + 11);
    y += 18;

    // body text
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...C.textDark);
    const lines = doc.splitTextToSize(sec.text, WIDTH - 10);
    const blockH = lines.length * 11;
    checkPage(blockH + 6);

    doc.setFillColor(...C.lightGray);
    doc.rect(LEFT, y, WIDTH, blockH + 6, 'F');
    doc.text(lines, LEFT + 5, y + 9);
    y += blockH + 12;
  }

  y += 8; // gap between issues
  return y;
}

// ─── Build PDF ────────────────────────────────────────────────────────────────
const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });

// Page 1: Cover
addCover(doc);

// Page 2: ToC
addToc(doc, CATEGORIES);

// Content pages
let pageNum = 3;

for (let ci = 0; ci < CATEGORIES.length; ci++) {
  const cat = CATEGORIES[ci];
  doc.addPage();
  addPageHeader(doc, pageNum++, '?');

  let y = 45;
  const PAGE_H = 842;

  // Category header
  doc.setFillColor(...cat.color);
  doc.rect(0, y, 595, 32, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...C.white);
  doc.text(`${ci + 1}.  ${cat.title}`, 14, y + 21);
  y += 42;

  for (let ii = 0; ii < cat.items.length; ii++) {
    y = renderIssue(doc, cat.items[ii], ii + 1, y);
    if (y > PAGE_H - 60 && ii < cat.items.length - 1) {
      doc.addPage();
      addPageHeader(doc, pageNum++, '?');
      y = 45;
    }
  }
}

// ─── Write file ───────────────────────────────────────────────────────────────
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, Buffer.from(doc.output('arraybuffer')));
console.log(`Audit PDF written to ${outputPath}`);
