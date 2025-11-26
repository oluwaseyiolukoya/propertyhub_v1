# Contrezz Verification Service

Identity verification microservice for Contrezz platform. Handles document verification for property owners, developers, property managers, and tenants using third-party verification providers (Dojah, Youverify, etc.).

## 🏗️ Architecture

- **Independent Microservice**: Separate database, API, and deployment
- **Async Processing**: Redis job queue with BullMQ workers
- **Provider Abstraction**: Easy switching between verification providers
- **Secure**: API key authentication, data encryption, rate limiting

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL 15+
- Redis 7+
- AWS S3 bucket (for document storage)
- Dojah API credentials

### Installation

```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your configuration

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Start development server
npm run dev

# Start worker (in separate terminal)
npm run worker:dev
```

## 📁 Project Structure

```
verification-service/
├── src/
│   ├── config/          # Configuration (env, database, redis)
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── providers/       # Verification provider integrations
│   ├── middleware/      # Express middleware
│   ├── workers/         # Background job workers
│   ├── lib/             # Utilities (encryption, etc.)
│   └── types/           # TypeScript types
├── prisma/
│   ├── schema.prisma    # Database schema
│   └── migrations/      # Database migrations
└── package.json
```

## 🔧 Environment Variables

See `.env.example` for all required variables:

- **Service**: PORT, NODE_ENV
- **Database**: DATABASE_URL (PostgreSQL)
- **Redis**: REDIS_URL
- **Dojah API**: DOJAH_API_KEY, DOJAH_APP_ID
- **AWS S3**: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_BUCKET
- **Security**: API_KEY_MAIN_DASHBOARD, ENCRYPTION_KEY

## 📡 API Endpoints

### Health Check
- `GET /health` - Service health status

### Verification (requires API key)
- `POST /api/verification/submit` - Submit verification request
- `POST /api/verification/upload/:requestId` - Upload document
- `GET /api/verification/status/:requestId` - Get verification status
- `GET /api/verification/customer/:customerId` - Get customer verification

### Admin (requires admin API key)
- `GET /api/admin/requests` - List all verification requests
- `GET /api/admin/requests/:requestId` - Get request details
- `POST /api/admin/requests/:requestId/approve` - Approve verification
- `POST /api/admin/requests/:requestId/reject` - Reject verification
- `GET /api/admin/analytics` - Get analytics

### Webhooks
- `POST /webhook/dojah` - Dojah webhook handler

## 🔐 Authentication

All API endpoints (except `/health` and `/webhook/*`) require API key authentication:

```bash
curl -H "X-API-Key: your_api_key_here" http://localhost:5001/api/verification/status/123
```

## 🗄️ Database

### Migrations

```bash
# Create migration
npx prisma migrate dev --name description

# Deploy to production
npx prisma migrate deploy

# Check status
npx prisma migrate status

# Open Prisma Studio
npx prisma studio
```

### Models

- `verification_requests` - Verification requests
- `verification_documents` - Uploaded documents
- `verification_history` - Audit trail
- `api_keys` - API key management
- `provider_logs` - Provider API call logs

## 🔄 Job Queue

Uses BullMQ with Redis for async verification processing:

```typescript
// Add job to queue
await queueService.addVerificationJob(documentId);

// Worker processes job
// Calls Dojah API
// Updates database
// Sends notification
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run with coverage
npm test -- --coverage
```

## 📦 Deployment

### Docker

```bash
# Build image
docker build -t verification-service .

# Run with docker-compose
docker-compose up -d
```

### Digital Ocean

```bash
# Deploy using App Platform
doctl apps create --spec .do/app.yaml
```

## 🔒 Security

- ✅ API key authentication
- ✅ Rate limiting (100 req/min)
- ✅ Data encryption (AES-256-GCM)
- ✅ Secure S3 storage
- ✅ CORS configuration
- ✅ Helmet security headers
- ✅ Request validation

## 📊 Monitoring

- Health check endpoint: `/health`
- Provider logs in database
- Audit trail for all actions
- Job queue metrics

## 🐛 Troubleshooting

### Database connection error
```bash
# Check DATABASE_URL in .env
# Ensure PostgreSQL is running
# Test connection: psql $DATABASE_URL
```

### Redis connection error
```bash
# Check REDIS_URL in .env
# Ensure Redis is running
# Test connection: redis-cli ping
```

### Worker not processing jobs
```bash
# Check Redis connection
# Ensure worker is running: npm run worker:dev
# Check worker logs
```

## 📚 Documentation

- [Implementation Plan](../identity-verification.plan.md)
- [Cursor Rules](../.cursorrules-identity-verification)
- [Dojah API Docs](https://docs.dojah.io/)

## 🤝 Contributing

1. Follow Cursor rules (`.cursorrules-identity-verification`)
2. Use Prisma migrations for database changes
3. Write tests for new features
4. Update documentation

## 📝 License

Proprietary - Contrezz Platform

