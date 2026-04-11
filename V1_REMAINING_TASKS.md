# V1 Remaining Tasks Checklist

**Version:** 0.0.3  
**Started:** January 4, 2026  
**Status:** 🚧 In Progress

---

## Task Overview: 8 Features Remaining

### 1. 🟡 Real-time Updates (WebSockets)
**Priority:** High  
**Estimated Time:** 4-6 hours

- [ ] Install and configure Socket.io server
- [ ] Create WebSocket connection handler
- [ ] Implement live chat functionality
  - [ ] Customer ↔ Shop messaging
  - [ ] Real-time message delivery
  - [ ] Typing indicators
  - [ ] Message read receipts
- [ ] Implement live status updates
  - [ ] Work order status changes broadcast
  - [ ] Real-time notifications
  - [ ] Dashboard auto-refresh
- [ ] Tech location tracking
  - [ ] GPS coordinate sharing
  - [ ] Live map updates
  - [ ] Location history
- [ ] Test WebSocket connections
- [ ] Handle reconnection logic
- [ ] Add error handling

**Files to Create/Modify:**
- `src/lib/socket-server.ts` (new)
- `src/lib/socket-client.ts` (new)
- `src/app/api/socket/route.ts` (new)
- Update components with socket hooks

---

### 2. 🟡 Service Pricing & Management
**Priority:** High  
**Estimated Time:** 3-4 hours

- [ ] Create `/api/services` endpoints
  - [ ] GET - List all services for a shop
  - [ ] POST - Create new service
  - [ ] PUT - Update service
  - [ ] DELETE - Remove service
- [ ] Create service management UI page
  - [ ] Service list view
  - [ ] Add/Edit service modal
  - [ ] Category filtering (diesel/gas)
  - [ ] Price and duration inputs
- [ ] Integrate with work order creation
  - [ ] Service selector in work order form
  - [ ] Auto-populate pricing
  - [ ] Calculate labor time
- [ ] Add default services seeder
  - [ ] 51 common services
  - [ ] Diesel and gas categories
- [ ] Test CRUD operations
- [ ] Add validation

**Files to Create/Modify:**
- `src/app/api/services/route.ts` (new)
- `src/app/api/services/[id]/route.ts` (new)
- `src/app/shop/services/page.tsx` (new)
- Update work order form

---

### 3. 🟡 Estimate Creation UI
**Priority:** Medium  
**Estimated Time:** 3-4 hours

- [ ] Create estimate builder component
  - [ ] Line item manager
  - [ ] Add parts/services
  - [ ] Quantity and price inputs
  - [ ] Tax calculation
  - [ ] Total calculation
- [ ] Create manager estimate page
  - [ ] Work order details display
  - [ ] Estimate form
  - [ ] Preview before send
  - [ ] Submit and email
- [ ] Update work order API
  - [ ] Save estimate to database
  - [ ] Trigger email notification
  - [ ] Update status to waiting-estimate
- [ ] Create customer estimate view
  - [ ] Display estimate details
  - [ ] Accept/Decline buttons
  - [ ] Comments/questions
- [ ] Test estimate workflow
- [ ] Email template for estimates

**Files to Create/Modify:**
- `src/components/EstimateBuilder.tsx` (new)
- `src/app/manager/estimates/[id]/page.tsx` (new)
- `src/app/customer/estimates/[id]/page.tsx` (new)
- Update `/api/workorders/[id]`

---

### 4. 🟡 Inventory Tracking
**Priority:** Medium  
**Estimated Time:** 4-5 hours

- [ ] Create inventory API endpoints
  - [ ] GET `/api/inventory` - List items
  - [ ] POST `/api/inventory` - Add item
  - [ ] PUT `/api/inventory/[id]` - Update item
  - [ ] DELETE `/api/inventory/[id]` - Remove item
  - [ ] GET `/api/inventory/low-stock` - Low stock alerts
- [ ] Create inventory management page
  - [ ] Inventory list table
  - [ ] Add/Edit item modal
  - [ ] Search and filter
  - [ ] Low stock indicators
  - [ ] Reorder alerts
- [ ] Integrate with work orders
  - [ ] Parts selector
  - [ ] Auto-deduct quantities
  - [ ] Track parts usage
  - [ ] Usage history
- [ ] Create inventory reports
  - [ ] Stock levels
  - [ ] Usage statistics
  - [ ] Reorder recommendations
- [ ] Test inventory operations
- [ ] Add validation and error handling

**Files to Create/Modify:**
- `src/app/api/inventory/route.ts` (new)
- `src/app/api/inventory/[id]/route.ts` (new)
- `src/app/api/inventory/low-stock/route.ts` (new)
- `src/app/shop/inventory/page.tsx` (new)
- Update work order parts section

---

### 5. 🟡 Customer Portal Dashboard Enhancement
**Priority:** Medium  
**Estimated Time:** 3-4 hours

- [ ] Enhanced work order history
  - [ ] Timeline view
  - [ ] Status tracking visual
  - [ ] Filter by status/date
  - [ ] Search functionality
- [ ] Vehicle management improvements
  - [ ] Add multiple vehicles
  - [ ] Vehicle details page
  - [ ] Service history per vehicle
  - [ ] Maintenance reminders
- [ ] Saved addresses feature
  - [ ] Add/Edit/Delete addresses
  - [ ] Set default address
  - [ ] Quick select in work order
- [ ] Service records enhancement
  - [ ] Downloadable service history
  - [ ] Maintenance schedule
  - [ ] Recommended services
  - [ ] Cost analysis
- [ ] Dashboard widgets
  - [ ] Upcoming appointments
  - [ ] Recent activity
  - [ ] Quick actions
- [ ] Test customer portal features

**Files to Create/Modify:**
- `src/app/customer/dashboard/page.tsx` (update)
- `src/app/customer/vehicles/page.tsx` (enhance)
- `src/app/customer/addresses/page.tsx` (new)
- `src/app/customer/history/page.tsx` (new)
- Add new API endpoints as needed

---

### 6. 🟡 Analytics Dashboard
**Priority:** Low  
**Estimated Time:** 4-5 hours

- [ ] Install recharts library
- [ ] Create analytics API endpoints
  - [ ] Revenue metrics
  - [ ] Completion time stats
  - [ ] Tech performance data
  - [ ] Customer metrics
- [ ] Create analytics dashboard page
  - [ ] Revenue charts (line, bar)
  - [ ] Completion time graphs
  - [ ] Tech performance comparison
  - [ ] Customer satisfaction
  - [ ] Date range selector
- [ ] Add analytics cards
  - [ ] Total revenue
  - [ ] Average completion time
  - [ ] Jobs completed
  - [ ] Customer retention
- [ ] Export analytics reports
  - [ ] PDF export
  - [ ] CSV export
  - [ ] Custom date ranges
- [ ] Test analytics calculations
- [ ] Optimize query performance

**Files to Create/Modify:**
- Install: `npm install recharts`
- `src/app/api/analytics/route.ts` (new)
- `src/app/shop/analytics/page.tsx` (new)
- `src/components/AnalyticsCharts.tsx` (new)

---

### 7. 🟡 Security Enhancements
**Priority:** High  
**Estimated Time:** 3-4 hours

- [ ] Rate limiting
  - [ ] Install express-rate-limit or next-rate-limit
  - [ ] Configure rate limits per endpoint
  - [ ] Authentication endpoints: 5 requests/15min
  - [ ] API endpoints: 100 requests/15min
  - [ ] Add rate limit headers
- [ ] Input validation with Zod
  - [ ] Create validation schemas
  - [ ] Work order validation
  - [ ] User registration validation
  - [ ] Payment validation
  - [ ] Apply to all POST/PUT endpoints
- [ ] CORS configuration
  - [ ] Configure allowed origins
  - [ ] Set proper headers
  - [ ] Handle preflight requests
- [ ] XSS sanitization
  - [ ] Install DOMPurify or sanitize-html
  - [ ] Sanitize user inputs
  - [ ] Escape HTML in outputs
  - [ ] Validate file uploads
- [ ] CSRF protection
  - [ ] Implement CSRF tokens
  - [ ] Validate on state-changing requests
- [ ] Security headers
  - [ ] Content-Security-Policy
  - [ ] X-Frame-Options
  - [ ] X-Content-Type-Options
- [ ] Test security measures
- [ ] Security audit

**Files to Create/Modify:**
- `src/lib/rate-limit.ts` (new)
- `src/lib/validation.ts` (new)
- `src/lib/sanitize.ts` (new)
- `src/middleware.ts` (update)
- Apply to all API routes

---

### 8. 🟡 Admin Dashboard
**Priority:** Medium  
**Estimated Time:** 4-5 hours

- [ ] Create admin authentication
  - [ ] Admin login page
  - [ ] Secure admin routes
  - [ ] Admin role verification
- [ ] Admin dashboard overview
  - [ ] System statistics
  - [ ] Active shops count
  - [ ] Total users
  - [ ] Revenue overview
  - [ ] Recent activity
- [ ] Shop management interface
  - [ ] List all shops
  - [ ] Approve/Reject shops
  - [ ] Suspend/Activate shops
  - [ ] View shop details
  - [ ] Edit shop info
- [ ] User management
  - [ ] List all users (customers/techs)
  - [ ] View user details
  - [ ] Suspend/Ban users
  - [ ] Reset passwords
- [ ] Audit logs viewing
  - [ ] Activity log table
  - [ ] Filter by user/shop/action
  - [ ] Search functionality
  - [ ] Export logs
- [ ] System settings
  - [ ] Platform configurations
  - [ ] Email templates
  - [ ] Payment settings
- [ ] Test admin features
- [ ] Add admin permissions

**Files to Create/Modify:**
- `src/app/admin/login/page.tsx` (new)
- `src/app/admin/dashboard/page.tsx` (new)
- `src/app/admin/shops/page.tsx` (new)
- `src/app/admin/users/page.tsx` (new)
- `src/app/admin/logs/page.tsx` (new)
- `src/app/api/admin/*` (new endpoints)

---

## Progress Tracking

**Total Tasks:** 8 features  
**Completed:** 0  
**In Progress:** 0  
**Pending:** 8

**Overall Progress:** 0% ⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜

---

## Priority Order (Recommended)

1. **Security Enhancements** (High Priority) - Protect the application
2. **Real-time Updates** (High Priority) - Better user experience
3. **Service Pricing & Management** (High Priority) - Core business feature
4. **Inventory Tracking** (Medium Priority) - Business operations
5. **Estimate Creation UI** (Medium Priority) - Complete work order flow
6. **Customer Portal Enhancement** (Medium Priority) - Customer satisfaction
7. **Admin Dashboard** (Medium Priority) - Platform management
8. **Analytics Dashboard** (Low Priority) - Business insights

---

## Dependencies

- **recharts** - For analytics charts
- **express-rate-limit** or **next-rate-limit** - For rate limiting
- **zod** - For input validation (already installed)
- **DOMPurify** or **sanitize-html** - For XSS protection
- **socket.io** - For real-time updates (already installed)

---

## Notes

- Each task has detailed sub-tasks to track progress
- Estimated times are approximate
- Some tasks can be done in parallel
- Test thoroughly after each implementation
- Update this checklist as tasks are completed

---

**Last Updated:** January 4, 2026
