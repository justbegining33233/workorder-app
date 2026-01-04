# Advanced Features Implementation Guide

This document describes all the advanced features implemented in the work order management system.

## 📋 Table of Contents

1. [Break Tracking](#break-tracking)
2. [GPS Verification](#gps-verification)
3. [Photo Capture](#photo-capture)
4. [Automatic Inventory Deduction](#automatic-inventory-deduction)
5. [Overtime Calculations](#overtime-calculations)
6. [PDF Report Generation](#pdf-report-generation)
7. [Budget Tracking](#budget-tracking)
8. [Email Notifications](#email-notifications)

---

## 🕐 Break Tracking

### Overview
Employees can now start and end breaks during their shifts. Break time is automatically subtracted from total work hours for accurate payroll calculations.

### Features
- **Break Start/End Buttons**: Visible in the TimeClock component
- **Real-time Break Timer**: Shows current break duration
- **Break History**: All breaks are stored with timestamps
- **Automatic Deduction**: Break time is subtracted from total work hours
- **Visual Indicators**: Break button turns orange when on break

### Database Schema
```sql
model TimeEntry {
  breakStart    DateTime?
  breakEnd      DateTime?
  breakDuration Float?    // Minutes
}
```

### API Endpoints

#### POST /api/time-tracking
**Actions**: `break-start`, `break-end`

**Break Start Request**:
```json
{
  "shopId": "shop123",
  "techId": "tech456",
  "action": "break-start"
}
```

**Break End Request**:
```json
{
  "shopId": "shop123",
  "techId": "tech456",
  "action": "break-end"
}
```

### Usage
1. Employee clocks in normally
2. When taking a break, click "Start Break"
3. Break timer starts counting
4. Click "End Break" when returning to work
5. Break duration is saved and deducted from work hours

---

## 📍 GPS Verification

### Overview
Verify that employees are physically at the shop location when clocking in/out using GPS coordinates.

### Features
- **Location Verification**: Checks employee location against shop coordinates
- **Configurable Radius**: Set acceptable distance in meters (default: 100m)
- **Haversine Formula**: Accurate distance calculation considering Earth's curvature
- **Error Handling**: Clear error messages if outside allowed radius
- **Optional**: Can be enabled/disabled in shop settings

### Configuration
Set in Shop Admin → Settings → GPS Verification:
- **Enable GPS Verification**: Toggle on/off
- **Shop Latitude**: Your shop's latitude (e.g., 40.7128)
- **Shop Longitude**: Your shop's longitude (e.g., -74.0060)
- **GPS Radius**: Allowed distance in meters (e.g., 100)

### Database Schema
```sql
model ShopSettings {
  gpsVerificationEnabled Boolean   @default(false)
  shopLatitude          Float?
  shopLongitude         Float?
  gpsRadiusMeters       Int?       @default(100)
}
```

### How It Works
1. Employee clicks "Clock In"
2. Browser requests geolocation permission
3. GPS coordinates are sent to API
4. Server calculates distance using Haversine formula:
   ```javascript
   function calculateDistance(lat1, lon1, lat2, lon2) {
     const R = 6371e3; // Earth's radius in meters
     const φ1 = lat1 * Math.PI/180;
     const φ2 = lat2 * Math.PI/180;
     const Δφ = (lat2-lat1) * Math.PI/180;
     const Δλ = (lon2-lon1) * Math.PI/180;
     
     const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
               Math.cos(φ1) * Math.cos(φ2) *
               Math.sin(Δλ/2) * Math.sin(Δλ/2);
     const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
     
     return R * c; // Distance in meters
   }
   ```
5. If distance > radius, clock-in is rejected

### Getting Shop Coordinates
Use one of these methods:
1. **Google Maps**: Right-click shop location → "What's here?" → Copy coordinates
2. **GPS Device**: Use a GPS device or smartphone app
3. **Online Tools**: Use geocoding services to convert address to coordinates

---

## 📸 Photo Capture

### Overview
Capture employee photos during clock in/out for visual verification and accountability.

### Features
- **Camera Access**: Uses browser's MediaDevices API
- **Front Camera**: Automatically uses front-facing camera on mobile
- **Photo Preview**: Shows captured photo before submission
- **Base64 Storage**: Photos stored as base64 strings in database
- **Clock In & Out**: Photos captured for both events

### Database Schema
```sql
model TimeEntry {
  clockInPhoto  String?  // Base64 encoded image
  clockOutPhoto String?  // Base64 encoded image
}
```

### Technical Implementation
1. Request camera permission:
   ```javascript
   const stream = await navigator.mediaDevices.getUserMedia({
     video: { facingMode: 'user' }
   });
   ```

2. Display video stream in `<video>` element

3. Capture frame to canvas:
   ```javascript
   const canvas = canvasRef.current;
   const video = videoRef.current;
   canvas.width = video.videoWidth;
   canvas.height = video.videoHeight;
   const context = canvas.getContext('2d');
   context.drawImage(video, 0, 0);
   ```

4. Convert to base64:
   ```javascript
   const photoData = canvas.toDataURL('image/jpeg', 0.8);
   ```

5. Send with clock in/out request

### Privacy Considerations
- Photos are only captured at clock in/out times
- Stored securely in the database
- Only accessible to shop administrators
- Can be disabled if not required

---

## 📦 Automatic Inventory Deduction

### Overview
When inventory requests are approved, the system automatically deducts the requested quantity from inventory stock.

### Features
- **Auto-Deduct**: Quantity automatically subtracted on approval
- **Stock Lookup**: Finds matching inventory items (case-insensitive)
- **Low Stock Alerts**: Warns when quantity drops below reorder point
- **Inventory Linking**: Links requests to specific inventory items
- **Safety Check**: Prevents negative quantities

### Database Schema
```sql
model InventoryRequest {
  inventoryItemId String?  // Links to InventoryStock
}

model InventoryStock {
  id              String
  itemName        String
  quantity        Int
  reorderPoint    Int
  reorderQuantity Int
}
```

### Workflow
1. Technician submits inventory request
2. Admin reviews and approves request
3. System searches for matching inventory item:
   ```javascript
   const inventoryItem = await prisma.inventoryStock.findFirst({
     where: {
       shopId: request.shopId,
       itemName: {
         contains: request.itemName,
         mode: 'insensitive',
       },
     },
   });
   ```

4. Quantity is deducted:
   ```javascript
   const newQuantity = Math.max(0, item.quantity - request.quantity);
   ```

5. Low stock check:
   ```javascript
   if (newQuantity <= item.reorderPoint) {
     console.log('⚠️ Low stock alert');
     // Send email notification
   }
   ```

6. Request is linked to inventory item

### API Response
```json
{
  "request": { ... },
  "message": "Request updated successfully",
  "inventoryUpdated": true
}
```

---

## ⏰ Overtime Calculations

### Overview
Automatically calculate overtime pay for employees working more than 40 hours per week.

### Features
- **Week-by-Week Tracking**: Hours tracked per ISO week
- **40-Hour Threshold**: Standard hours up to 40/week
- **Configurable Multiplier**: Default 1.5x (time and a half)
- **Separate Pay Calculations**: Regular pay + overtime pay
- **CSV Export**: Includes overtime breakdown
- **PDF Reports**: Shows overtime hours and pay

### Configuration
Set in Shop Admin → Settings:
- **Overtime Multiplier**: Default 1.5 (time and a half)

### Database Schema
```sql
model ShopSettings {
  overtimeMultiplier Float @default(1.5)
}
```

### Calculation Logic
```javascript
// Group hours by ISO week
const getWeekKey = (date) => {
  const year = date.getFullYear();
  const week = getWeekNumber(date);
  return `${year}-W${week.toString().padStart(2, '0')}`;
};

// Calculate overtime
for (const entry of timeEntries) {
  const week = getWeekKey(entry.clockIn);
  weeklyHours[employee.id][week] += entry.hoursWorked;
}

// Split regular and overtime
for (const [week, hours] of Object.entries(weeklyHours)) {
  if (hours <= 40) {
    regularHours += hours;
  } else {
    regularHours += 40;
    overtimeHours += hours - 40;
  }
}

// Calculate pay
const regularPay = regularHours * hourlyRate;
const overtimePay = overtimeHours * hourlyRate * overtimeMultiplier;
const totalPay = regularPay + overtimePay;
```

### Payroll Report
Displays:
- Regular Hours
- Overtime Hours
- Regular Pay
- Overtime Pay
- Total Pay

---

## 📄 PDF Report Generation

### Overview
Generate professional PDF payroll reports with summary and detailed breakdowns.

### Features
- **Professional Formatting**: Clean, branded layout
- **Summary Cards**: Total employees, hours, payroll
- **Detailed Table**: Per-employee breakdown
- **Overtime Breakdown**: Separate columns for regular/OT
- **Date Range**: Custom date selection
- **Auto-download**: Direct browser download

### Libraries Used
- **jsPDF**: PDF generation
- **jspdf-autotable**: Table formatting

### Implementation
```javascript
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const downloadPayrollPDF = () => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.setTextColor(229, 51, 42);
  doc.text('Payroll Report', 14, 22);
  
  // Date range
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Period: ${startDate} to ${endDate}`, 14, 30);
  
  // Summary cards
  const summaryData = [
    ['Total Employees', summary.employeeCount],
    ['Total Hours', summary.totalHours.toFixed(2)],
    ['Total Payroll', `$${summary.totalPay.toFixed(2)}`],
  ];
  
  // Employee table
  doc.autoTable({
    startY: 50,
    head: [['Employee', 'Regular Hrs', 'OT Hrs', 'Regular Pay', 'OT Pay', 'Total']],
    body: employeeRows,
  });
  
  doc.save('payroll-report.pdf');
};
```

### PDF Contents
1. **Header**: Report title and date range
2. **Summary Section**: Key metrics
3. **Employee Table**: Detailed breakdown
4. **Footer**: Generation timestamp

---

## 💰 Budget Tracking

### Overview
Set weekly and monthly payroll budgets and track spending in real-time with visual progress indicators.

### Features
- **Dual Budgets**: Separate weekly and monthly limits
- **Real-time Tracking**: Auto-refresh every 30 seconds
- **Progress Bars**: Visual spending indicators
- **Color Coding**: Green (< 80%), Yellow (80-90%), Red (> 90%)
- **Over-Budget Alerts**: Banner notification when exceeded
- **Optional**: Can be disabled by leaving budgets blank

### Configuration
Set in Shop Admin → Settings → Payroll Budget Limits:
- **Weekly Payroll Budget**: Maximum weekly spending
- **Monthly Payroll Budget**: Maximum monthly spending

### Database Schema
```sql
model ShopSettings {
  weeklyPayrollBudget  Float?
  monthlyPayrollBudget Float?
}
```

### Budget Calculation
```javascript
// Calculate date ranges
const now = new Date();
const startOfWeek = new Date(now);
startOfWeek.setDate(now.getDate() - now.getDay());
const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

// Fetch payroll data
const weeklyData = await fetch(
  `/api/shop/payroll?startDate=${startOfWeek}&endDate=${now}`
);
const monthlyData = await fetch(
  `/api/shop/payroll?startDate=${startOfMonth}&endDate=${now}`
);

// Calculate percentages
const weeklyPercentage = (weeklySpent / weeklyBudget) * 100;
const monthlyPercentage = (monthlySpent / monthlyBudget) * 100;
```

### UI Display
- **Progress Bar**: Shows percentage used
- **Dollar Amounts**: Current spending vs. budget
- **Color Indicators**: Visual status
- **Alert Banner**: Displayed when over budget

### Alert Thresholds
- **Green**: 0-80% of budget
- **Yellow**: 80-90% of budget
- **Red**: 90-100% of budget
- **Alert**: > 100% of budget

---

## 📧 Email Notifications

### Overview
Automated email notifications for key events in the system.

### Supported Email Services
1. **Resend** (Recommended): Modern, developer-friendly API
2. **SendGrid**: Enterprise-grade email delivery
3. **SMTP**: Generic email provider

### Configuration

#### Option 1: Resend
```env
RESEND_API_KEY="re_..."
RESEND_FROM_EMAIL="notifications@yourdomain.com"
```

Sign up at: https://resend.com

#### Option 2: SendGrid
```env
SENDGRID_API_KEY="SG...."
SENDGRID_FROM_EMAIL="notifications@yourdomain.com"
```

Sign up at: https://sendgrid.com

### Email Templates

#### 1. Inventory Request Created
**Sent to**: Shop admin
**Trigger**: New inventory request submitted
**Contains**:
- Item name and quantity
- Urgency level (color-coded)
- Requester information
- Link to approve/deny

#### 2. Inventory Request Approved
**Sent to**: Requesting technician
**Trigger**: Request approved by admin
**Contains**:
- Approved item and quantity
- Order details
- Status confirmation

#### 3. Inventory Request Denied
**Sent to**: Requesting technician
**Trigger**: Request denied by admin
**Contains**:
- Denied item and quantity
- Reason for denial
- Next steps

#### 4. Low Stock Alert
**Sent to**: Shop admin
**Trigger**: Inventory quantity drops below reorder point
**Contains**:
- Item name
- Current quantity
- Reorder point threshold
- Link to restock

#### 5. Clock-In Reminder
**Sent to**: Technicians
**Trigger**: Scheduled daily (optional)
**Contains**:
- Greeting
- Reminder to clock in
- Link to time clock

#### 6. Payroll Budget Alert
**Sent to**: Shop admin
**Trigger**: Budget exceeds 90% or 100%
**Contains**:
- Current spending
- Budget limit
- Percentage used
- Severity indicator

### Implementation

#### Send Email Function
```javascript
import { sendEmail } from '@/lib/emailService';

// Send notification
await sendEmail({
  to: 'recipient@example.com',
  subject: 'Notification Subject',
  html: '<html>Email content</html>',
});
```

#### Email Service Code
Located in: `src/lib/emailService.ts`

Features:
- Template system
- Multiple provider support
- Error handling
- Fallback to console logging in development

### Triggering Emails

#### Inventory Request Created
```javascript
// In POST /api/shop/inventory-requests
const shop = await prisma.shop.findUnique({
  where: { id: shopId },
  select: { email: true, name: true },
});

await sendInventoryRequestNotification(
  shop.email,
  shop.name,
  itemName,
  quantity,
  urgency
);
```

#### Inventory Request Approved/Denied
```javascript
// In PATCH /api/shop/inventory-requests
const tech = await prisma.tech.findUnique({
  where: { id: requestedById },
  select: { email: true },
});

await sendInventoryApprovalNotification(
  tech.email,
  itemName,
  quantity,
  approved,
  reason
);
```

### Testing Emails
In development (without API keys):
- Emails are logged to console
- Full HTML content displayed
- No actual emails sent

To test with real emails:
1. Sign up for Resend or SendGrid
2. Add API keys to `.env.local`
3. Verify sender domain
4. Test with actual events

### Email Deliverability
Tips for high deliverability:
1. **Verify Domain**: Add DNS records (SPF, DKIM, DMARC)
2. **Professional Content**: Use proper formatting
3. **Unsubscribe Links**: Add for compliance
4. **Monitor Bounces**: Remove invalid addresses
5. **Warm Up**: Gradually increase sending volume

---

## 🚀 Quick Start Guide

### 1. Enable Break Tracking
- No configuration needed
- Works automatically for all employees
- Visible in TimeClock component

### 2. Setup GPS Verification
1. Go to Shop Admin → Settings → GPS Verification
2. Check "Enable GPS verification"
3. Enter shop coordinates (use Google Maps)
4. Set radius (100m recommended)
5. Click "Save Settings"

### 3. Enable Photo Capture
- No configuration needed
- Browser will request camera permission
- Works on clock in/out

### 4. Configure Inventory
1. Go to Shop Admin → Inventory
2. Add inventory items with:
   - Item name
   - Quantity
   - Reorder point
3. Auto-deduction works automatically on approval

### 5. Setup Overtime
1. Go to Shop Admin → Settings
2. Set "Overtime Multiplier" (default: 1.5)
3. Overtime calculated automatically in payroll

### 6. Enable Budget Tracking
1. Go to Shop Admin → Settings → Payroll Budget Limits
2. Enter weekly budget (e.g., $5000)
3. Enter monthly budget (e.g., $20000)
4. Save settings
5. View budget status in Overview tab

### 7. Configure Email Notifications
1. Sign up for Resend or SendGrid
2. Add API key to `.env.local`:
   ```env
   RESEND_API_KEY="your-key-here"
   RESEND_FROM_EMAIL="notifications@yourdomain.com"
   ```
3. Restart development server
4. Emails sent automatically on events

---

## 📊 Dashboard Overview

The admin dashboard now displays:

### Key Stats Cards
- Open Work Orders
- Completed Today
- Today's Revenue
- This Week's Revenue
- Team Members (with clocked in count)
- Pending Actions (work orders + inventory)

### Budget Tracking Section
- Weekly budget progress bar
- Monthly budget progress bar
- Over-budget alerts
- Color-coded status indicators

### Currently Clocked In
- List of active employees
- Clock-in times
- Current duration
- Role badges

### Quick Actions
- View shop dashboard
- Manage team
- Generate payroll
- View inventory requests

---

## 🔧 Troubleshooting

### GPS Not Working
- **Check Browser Permissions**: Allow location access
- **HTTPS Required**: GPS only works on secure connections
- **Check Coordinates**: Verify shop latitude/longitude are correct
- **Test Radius**: Increase radius if employees nearby can't clock in

### Camera Not Working
- **Check Browser Permissions**: Allow camera access
- **HTTPS Required**: Camera only works on secure connections
- **Mobile Issues**: Ensure front camera is selected
- **Browser Support**: Use Chrome, Safari, or Edge

### Email Not Sending
- **Check API Keys**: Verify keys in `.env.local`
- **Verify Domain**: Add DNS records for sender domain
- **Check Logs**: Review console for error messages
- **Test Service**: Verify API key works in provider dashboard

### Budget Not Showing
- **Set Budget Limits**: Must be configured in settings
- **Check Payroll Data**: Ensure time entries exist
- **Refresh Page**: Budget refreshes every 30 seconds
- **Check Console**: Look for API errors

### Overtime Not Calculating
- **Check Settings**: Verify overtime multiplier is set
- **Week Boundaries**: Overtime calculated per ISO week
- **Date Range**: Ensure payroll covers full weeks
- **Database Migration**: Verify schema includes overtimeMultiplier

---

## 📝 API Reference

### Time Tracking
**POST** `/api/time-tracking`
```json
{
  "shopId": "string",
  "techId": "string",
  "action": "clock-in" | "clock-out" | "break-start" | "break-end",
  "location": {
    "latitude": 40.7128,
    "longitude": -74.0060
  },
  "photo": "data:image/jpeg;base64,..."
}
```

### Payroll
**GET** `/api/shop/payroll?shopId={id}&startDate={iso}&endDate={iso}`

Response:
```json
{
  "employees": [{
    "id": "string",
    "name": "string",
    "hourlyRate": 25.00,
    "regularHours": 40.0,
    "overtimeHours": 5.0,
    "regularPay": 1000.00,
    "overtimePay": 187.50,
    "totalPay": 1187.50
  }],
  "summary": {
    "employeeCount": 5,
    "totalHours": 225.0,
    "totalPay": 5937.50
  }
}
```

### Inventory Requests
**PATCH** `/api/shop/inventory-requests`
```json
{
  "requestId": "string",
  "status": "approved" | "denied",
  "orderDetails": "string",
  "approvedBy": "string"
}
```

Response:
```json
{
  "request": { ... },
  "message": "Request updated successfully",
  "inventoryUpdated": true
}
```

---

## 🎯 Best Practices

### Break Tracking
- Encourage employees to take proper breaks
- Monitor break patterns for compliance
- Include break policy in employee handbook

### GPS Verification
- Set reasonable radius (50-200m recommended)
- Account for GPS accuracy variations
- Test from different areas of shop
- Have backup plan for GPS failures

### Photo Capture
- Inform employees about photo policy
- Store photos securely
- Have retention policy
- Consider privacy regulations

### Inventory Management
- Keep reorder points accurate
- Review low stock alerts regularly
- Update quantities after physical counts
- Maintain supplier information

### Budget Tracking
- Review budgets monthly
- Adjust based on seasonal changes
- Account for overtime in budgets
- Set realistic limits

### Email Notifications
- Don't overwhelm users with emails
- Allow users to configure preferences
- Include unsubscribe options
- Monitor delivery rates

---

## 📚 Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
- [Resend Documentation](https://resend.com/docs)
- [SendGrid Documentation](https://docs.sendgrid.com)
- [MDN Web APIs](https://developer.mozilla.org/en-US/docs/Web/API)
- [jsPDF Documentation](https://github.com/parallax/jsPDF)

---

## 🤝 Support

For issues or questions:
1. Check this documentation first
2. Review console logs for errors
3. Check database migrations are applied
4. Verify environment variables are set
5. Test in different browsers

---

**Last Updated**: January 2025
**Version**: 1.0.0
