# FixTray Production Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
# Copy package manifests AND scripts folder before npm install so that the
# postinstall hook (prisma-safe-generate.js) and prisma schema are available.
COPY package*.json ./
COPY scripts/ ./scripts/
COPY prisma/ ./prisma/
RUN npm install --production=false
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app .
EXPOSE 3000
CMD ["npm", "start"]
