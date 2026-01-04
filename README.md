# FixTray - Work Order Management System

A comprehensive work order management application for diesel/gas shops, technicians, and customers built with Next.js 16, React 19, and TypeScript.

## 🚀 Features

### Multi-Role System

### Core Functionality

### Technician Tools
1. New Roadside Job
2. New In-Shop Job
3. Share Location
4. Messages
5. Active Jobs
6. Job History
7. Parts Inventory
8. Service Manuals
9. Time Tracking
10. Customer Portal
11. Diagnostic Tools
12. Photo Upload

## 📋 Prerequisites


## 🛠️ Installation

1. Clone or download the repository
2. Install dependencies:
   ```bash
   npm install
   ```

## 🏃 Running the Application

### Development Mode
```bash
npm run dev
```
The app will start on `http://localhost:3000`

### Production Build
```bash
npm run build
npm start
```

## 👥 Initial Setup

### Create Admin Account
After setting up the database, create your first admin account:

```bash
node create-admin.js
```

Follow the prompts to enter:

### User Registration

## 📁 Project Structure

```
workorder-app/
├── src/
│   ├── app/
│   │   ├── admin/          # Admin dashboard & management
│   │   ├── auth/           # Login, registration, approval pages
│   │   ├── customer/       # Customer portal
│   │   ├── shop/           # Shop dashboard & management
│   │   ├── tech/           # Technician tools & portal
│   │   ├── manager/        # Manager dashboard
│   │   ├── workorders/     # Work order pages
│   │   └── api/            # API routes
│   ├── components/         # Reusable React components
│   ├── lib/               # Client-side utilities (localStorage)
│   ├── types/             # TypeScript type definitions
│   └── styles/            # Global styles
├── public/                # Static assets
└── package.json
```

## 🔑 Key Files


## 💾 Data Storage

**Current Implementation:**

**Production Recommendations:**

## 🎨 Styling


## 🔄 Workflow

### Shop Onboarding
1. Shop registers via signup form
2. Credentials stored locally
3. Registration sent to pending approval
4. Admin reviews and approves/denies
5. Approved shops can log in and access system

### Work Order Lifecycle
1. Customer/Shop creates work order
2. Assigned to technician
3. Tech updates status, adds parts/labor
4. Estimate generated and sent for approval
5. Customer approves/rejects
6. Work completed and status updated
7. Payment processed and order closed

## 🚧 Future Enhancements


## 🐛 Known Limitations


## 📝 Environment Variables

Create a `.env.local` file for production:

```env
NEXT_PUBLIC_API_URL=your-api-url
DATABASE_URL=your-database-url
JWT_SECRET=your-secret-key
```

## 🔒 Security Notes

**For Production:**

## 📦 Deployment

### Vercel (Recommended)
```bash
npm install -g vercel
vercel
```

### Docker
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Traditional Hosting
```bash
npm run build
# Upload .next/, public/, package.json, package-lock.json
# Run: npm install --production && npm start
```

## 🤝 Support

For issues or questions, contact the development team.

## 📄 License

Private - All rights reserved


**Version:** 0.1.0  
**Last Updated:** December 2025  
**Status:** Beta - Ready for testing
