# Performance Optimization Checklist

## CDN
- Enable CDN for static assets (images, JS, CSS)
- Use Cloudinary or similar for image delivery

## Caching
- Set cache headers for API and static assets
- Use Redis/Memcached for server-side caching

## Image Optimization
- Use Next.js <Image> component for automatic optimization and lazy loading
- Serve images in WebP/AVIF formats

## Bundle Size
- Run webpack-bundle-analyzer (set ANALYZE=true)
- Remove unused dependencies and code
- Use dynamic imports for code splitting

## Monitoring
- Track API response times and error rates
- Monitor server resource usage
- Review bundle size and optimize as needed
