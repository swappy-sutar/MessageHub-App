# Enterprise Multi-Stage Dockerfile for MessageHub Backend
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Final lightweight runner image
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy node_modules and source code
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./
COPY . .

# Expose backend server port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

# Start production server
CMD ["node", "index.js"]
