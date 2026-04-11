# Production Smoke Test Checklist

## Pre-Launch
- Verify all environment variables are set for production
- Confirm database connection and migrations
- Ensure SSL and CDN are active
- Run all automated tests (unit, integration, E2E)

## User Flows
- Login and logout for all roles (admin, manager, tech, shop, customer)
- Create, view, edit, and delete work orders
- Assign work orders and change status
- Test filters, search, and dashboard views
- Upload files and images
- Send and receive notifications/emails
- Access admin features (role management, audit logs, tenant management)
- Export data and view analytics dashboards

## Security & Compliance
- Test rate limiting and CORS
- Validate input sanitization and XSS protection
- Check audit logs for admin actions
- Review privacy, terms, and compliance docs

## Performance
- Monitor API response times and server resource usage
- Test image optimization and bundle size

## Feedback
- Gather feedback from real users
- Document any usability or security issues
- Plan for hotfixes and improvements
