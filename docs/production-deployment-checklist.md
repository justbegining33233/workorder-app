# Production Deployment Checklist

## Pre-Deployment
- Review and update .env with production secrets
- Build and test Docker image locally
- Run all tests (unit, integration, E2E)
- Review CI/CD pipeline config in `.github/workflows/ci.yml`

## Server Setup
- Configure Nginx or load balancer for SSL and reverse proxy
- Set up firewall and security groups
- Ensure server resources meet expected load

## Deployment
- Deploy Docker container to production server
- Run database migrations (`npx prisma migrate deploy`)
- Start Next.js app (`npm start` or via Docker)
- Monitor logs and health check endpoint (`/api/health`)

## Post-Deployment
- Test all user flows in production
- Monitor error logs and performance
- Enable CDN for static assets
- Set up automated backups
- Document deployment steps and rollback procedures
