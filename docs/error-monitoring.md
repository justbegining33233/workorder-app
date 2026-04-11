# Error Tracking & Monitoring

## Recommended Services
- Use LogRocket or Bugsnag for error tracking (Sentry not yet compatible with Next.js 16)
- Integrate with Winston for centralized logging

## Performance Monitoring
- Use health check endpoint `/api/health` for uptime monitoring
- Track API response times and error rates in Winston logs
- Consider integrating with Datadog or New Relic for advanced metrics

## Setup Example
- Add LogRocket/Bugsnag client to `_app.tsx` for frontend error tracking
- Use Winston for backend logs
