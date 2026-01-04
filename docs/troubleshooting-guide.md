# Troubleshooting Guide

## Common Issues
- App won't start: Check .env and database connection
- Database errors: Verify PostgreSQL is running and credentials are correct
- Email not sending: Check SMTP config
- File uploads failing: Check Cloudinary credentials
- Stripe errors: Verify API keys and webhook

## Debugging
- Check logs in console and Winston output
- Use health check endpoint: `/api/health`
