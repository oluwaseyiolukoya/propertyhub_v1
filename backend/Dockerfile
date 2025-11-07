# Build stage
FROM node:18-slim AS builder

WORKDIR /app

# Install OpenSSL and CA certificates for Prisma
RUN apt-get update -y && apt-get install -y openssl ca-certificates curl && \
    update-ca-certificates

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Copy Prisma schema first to generate client before npm ci
COPY prisma ./prisma

# Set environment variable to skip Prisma binary download during install
ENV PRISMA_SKIP_POSTINSTALL_GENERATE=true

# Install dependencies without postinstall
RUN npm ci

# Now generate Prisma client with binaries
RUN npx prisma generate

# Copy source code
COPY src ./src

# Build TypeScript
RUN npm run build

# Production stage
FROM node:18-slim

WORKDIR /app

# Install OpenSSL and CA certificates for Prisma
RUN apt-get update -y && apt-get install -y openssl ca-certificates && \
    update-ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./

# Copy Prisma schema
COPY prisma ./prisma

# Set environment variable to skip Prisma binary download during install
ENV PRISMA_SKIP_POSTINSTALL_GENERATE=true

# Install production dependencies
RUN npm ci --only=production

# Copy pre-generated Prisma client from builder
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Copy built files from builder
COPY --from=builder /app/dist ./dist

# Create uploads directory
RUN mkdir -p uploads/documents uploads/logos uploads/maintenance

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application
CMD ["node", "dist/index.js"]

