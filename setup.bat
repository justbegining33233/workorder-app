@echo off
REM Work Order System - Windows Setup Script
REM Run this after installing PostgreSQL and configuring .env

echo.
echo 🚀 Starting Work Order System Setup...
echo.

REM Check if .env exists
if not exist ".env" (
    echo ❌ Error: .env file not found!
    echo Please copy .env.example to .env and configure your credentials:
    echo   copy .env.example .env
    echo Then edit .env with your:
    echo   - DATABASE_URL
    echo   - JWT_SECRET
    echo   - STRIPE_SECRET_KEY
    echo   - CLOUDINARY credentials
    echo   - EMAIL credentials
    exit /b 1
)

echo ✅ Found .env file
echo.

REM Generate Prisma Client
echo 📦 Generating Prisma Client...
call npx prisma generate
if errorlevel 1 (
    echo ❌ Prisma generate failed
    exit /b 1
)
echo ✅ Prisma Client generated
echo.

REM Push database schema
echo 🗄️  Creating database tables...
call npx prisma db push
if errorlevel 1 (
    echo ❌ Database push failed. Check your DATABASE_URL in .env
    exit /b 1
)
echo ✅ Database tables created
echo.

echo 🎉 Setup Complete!
echo.
echo 📚 Quick Start Guide:
echo.
echo 1. Start the development server:
echo    npm run dev
echo.
echo 2. Test Customer Registration:
echo    POST http://localhost:3000/api/customers/register
echo    Body: { email, password, firstName, lastName }
echo.
echo 3. Test Shop Registration:
echo    POST http://localhost:3000/api/shops-db/pending
echo    Body: { username, password, shopName, email, phone, zipCode }
echo.
echo 4. Login as Admin:
echo    http://localhost:3000/auth/login
echo    Username: admin1006
echo    Password: admin1006
echo.
echo 5. View Database:
echo    npx prisma studio
echo    Opens at http://localhost:5555
echo.
echo 📖 Documentation:
echo    - README.md - Complete guide
echo    - IMPLEMENTATION_GUIDE.md - Technical details
echo.
echo 🔐 Security Reminders:
echo    - Change admin1006 password in production
echo    - Use strong JWT_SECRET (64+ characters)
echo    - Enable HTTPS in production
echo    - Set up Stripe webhook endpoint
echo.
pause
