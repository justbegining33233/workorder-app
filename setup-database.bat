@echo off
echo ========================================
echo Work Order App - Database Setup
echo ========================================
echo.

echo Step 1: Creating database...
psql -U postgres -c "CREATE DATABASE workorders;" 2>nul
if %errorlevel% equ 0 (
    echo [SUCCESS] Database 'workorders' created!
) else (
    echo [INFO] Database may already exist, continuing...
)

echo.
echo Step 2: Creating .env file...
(
echo # Database Configuration
echo DATABASE_URL="postgresql://postgres:10062001@localhost:5432/workorders"
echo.
echo # JWT Authentication
echo JWT_SECRET="your-secret-key-change-in-production-12345"
echo JWT_EXPIRES_IN="7d"
echo.
echo # Email Configuration ^(Optional^)
echo EMAIL_HOST="smtp.gmail.com"
echo EMAIL_PORT="587"
echo EMAIL_USER="your-email@gmail.com"
echo EMAIL_PASS="your-app-password"
echo EMAIL_FROM="noreply@workorders.com"
echo.
echo # Stripe Configuration ^(Optional^)
echo STRIPE_SECRET_KEY="sk_test_your_stripe_key"
echo STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret"
echo.
echo # Cloudinary Configuration ^(Optional^)
echo CLOUDINARY_CLOUD_NAME="your-cloud-name"
echo CLOUDINARY_API_KEY="your-api-key"
echo CLOUDINARY_API_SECRET="your-api-secret"
echo.
echo # App Configuration
echo NEXT_PUBLIC_APP_NAME="Work Order Management System"
echo NODE_ENV="development"
) > .env

echo [SUCCESS] .env file created!
echo.
echo Step 3: Installing Prisma CLI...
call npm install -D prisma
echo.
echo Step 4: Pushing database schema...
call npx prisma db push
echo.
echo Step 5: Generating Prisma Client...
call npx prisma generate
echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo IMPORTANT: Edit .env file and update:
echo   - DATABASE_URL password if you used different password
echo   - JWT_SECRET with a secure random string
echo   - Email, Stripe, Cloudinary keys if you want those features
echo.
echo To start the app: npm run dev
echo.
pause
