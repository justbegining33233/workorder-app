# Database optimization checklist
- Ensure indexes on frequently queried columns (e.g., workorder status, priority, assignedTo)
- Use Prisma's query optimization features
- Monitor slow queries and optimize with EXPLAIN

# Caching layer example (Redis)
# Add to .env and use in API routes for caching responses

# Image optimization
- Use Next.js <Image> component for automatic optimization and lazy loading
- Serve images from Cloudinary or CDN

# Bundle size optimization
- Use webpack-bundle-analyzer (set ANALYZE=true)
- Remove unused dependencies and code
- Split code with dynamic imports
