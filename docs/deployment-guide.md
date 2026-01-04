# Deployment Guide

## Prerequisites
- Node.js 20+
- PostgreSQL database
- Docker (optional)
- Cloudinary, Stripe, SMTP credentials

## Steps
1. Clone repository
2. Set up .env file with production secrets
3. Run `npm install`
4. Run database migrations (`npx prisma migrate deploy`)
5. Build app: `npm run build`
6. Start server: `npm start`
7. (Optional) Build and run Docker container
8. Configure Nginx/SSL for production

## CI/CD
- See .github/workflows/ci.yml for pipeline
