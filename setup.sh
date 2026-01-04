#!/bin/bash

# Work Order System - Complete Setup Script
# Run this after installing PostgreSQL and configuring .env

echo "🚀 Starting Work Order System Setup..."
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "Please copy .env.example to .env and configure your credentials:"
    echo "  cp .env.example .env"
    echo "Then edit .env with your:"
    echo "  - DATABASE_URL"
    echo "  - JWT_SECRET"
    echo "  - STRIPE_SECRET_KEY"
    echo "  - CLOUDINARY credentials"
    echo "  - EMAIL credentials"
    exit 1
fi

echo "✅ Found .env file"
echo ""

# Generate Prisma Client
echo "📦 Generating Prisma Client..."
npx prisma generate
if [ $? -ne 0 ]; then
    echo "❌ Prisma generate failed"
    exit 1
fi
echo "✅ Prisma Client generated"
echo ""

# Push database schema
echo "🗄️  Creating database tables..."
npx prisma db push
if [ $? -ne 0 ]; then
    echo "❌ Database push failed. Check your DATABASE_URL in .env"
    exit 1
fi
echo "✅ Database tables created"
echo ""

# Create default admin
echo "👤 Creating default admin account..."
node -e "
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

(async () => {
  try {
    const hashedPassword = await bcrypt.hash('admin1006', 12);
    const admin = await prisma.admin.upsert({
      where: { username: 'admin1006' },
      update: {},
      create: {
        username: 'admin1006',
        password: hashedPassword,
        email: 'admin@workorder.com',
        isSuperAdmin: true,
      },
    });
    console.log('Admin created:', admin.username);
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.\$disconnect();
  }
})();
"
echo "✅ Admin account ready (username: admin1006, password: admin1006)"
echo ""

echo "🎉 Setup Complete!"
echo ""
echo "📚 Quick Start Guide:"
echo ""
echo "1. Start the development server:"
echo "   npm run dev"
echo ""
echo "2. Test Customer Registration:"
echo "   POST http://localhost:3000/api/customers/register"
echo "   Body: { email, password, firstName, lastName }"
echo ""
echo "3. Test Shop Registration:"
echo "   POST http://localhost:3000/api/shops-db/pending"
echo "   Body: { username, password, shopName, email, phone, zipCode }"
echo ""
echo "4. Login as Admin:"
echo "   http://localhost:3000/auth/login"
echo "   Username: admin1006"
echo "   Password: admin1006"
echo ""
echo "5. View Database:"
echo "   npx prisma studio"
echo "   Opens at http://localhost:5555"
echo ""
echo "📖 Documentation:"
echo "   - README.md - Complete guide"
echo "   - IMPLEMENTATION_GUIDE.md - Technical details"
echo ""
echo "🔐 Security Reminders:"
echo "   - Change admin1006 password in production"
echo "   - Use strong JWT_SECRET (64+ characters)"
echo "   - Enable HTTPS in production"
echo "   - Set up Stripe webhook endpoint"
echo ""
