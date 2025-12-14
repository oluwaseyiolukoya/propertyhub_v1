# Contrezz Public Backend API

This is the backend API for Contrezz's public-facing pages (contrezz.com). It handles content for landing pages, careers, blog, and other public content.

## 🎯 Purpose

This backend is **completely separate** from the main application backend and has its own database. This separation provides:

- **Security**: Public content isolated from user data
- **Performance**: Independent scaling for public traffic
- **Simplicity**: No authentication required for public endpoints
- **Flexibility**: Different tech stack or hosting if needed

## 📁 Project Structure

```
public-backend/
├── src/
│   ├── index.ts              # Main server file
│   ├── lib/
│   │   └── db.ts             # Prisma client
│   ├── middleware/
│   │   └── rateLimiter.ts    # Rate limiting
│   ├── routes/
│   │   ├── careers.ts        # Career postings API
│   │   ├── blog.ts           # Blog posts API (future)
│   │   └── landing.ts        # Landing pages API (future)
│   └── services/
│       ├── career.service.ts # Career business logic
│       └── sync.service.ts   # Data sync (future)
├── prisma/
│   └── schema.prisma         # Database schema
├── .do/
│   └── app.yaml              # DigitalOcean config
└── package.json
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 15+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Create .env file
cp .env.example .env
# Edit .env with your database credentials
```

### Database Setup

```bash
# Create database
createdb contrezz_public

# Run migrations
npx prisma migrate dev

# Seed data (optional)
npm run seed
```

### Development

```bash
# Start development server with hot reload
npm run dev

# Server runs on http://localhost:5001
```

### Build & Production

```bash
# Build TypeScript
npm run build

# Start production server
npm start
```

## 🔌 API Endpoints

### Careers API

**Get all career postings (public)**

```
GET /api/careers
Query params:
  - department: string
  - location: string
  - type: string (Full-time, Part-time, etc.)
  - remote: string (Remote, Hybrid, On-site)
  - experience: string (Entry-level, Mid-level, Senior)
  - search: string
  - page: number (default: 1)
  - limit: number (default: 20)

Response:
{
  "success": true,
  "data": {
    "postings": [...],
    "pagination": {
      "total": 10,
      "page": 1,
      "limit": 20,
      "totalPages": 1
    }
  }
}
```

**Get filter options**

```
GET /api/careers/filters

Response:
{
  "success": true,
  "data": {
    "departments": ["Engineering", "Sales", ...],
    "locations": ["Lagos", "Remote", ...],
    "types": ["Full-time", "Contract", ...],
    "remoteOptions": ["Remote", "Hybrid", "On-site"],
    "experienceLevels": ["Entry-level", "Mid-level", "Senior"]
  }
}
```

**Get career statistics**

```
GET /api/careers/stats

Response:
{
  "success": true,
  "data": {
    "totalOpenings": 5,
    "departmentCounts": [
      { "department": "Engineering", "count": 3 },
      { "department": "Sales", "count": 2 }
    ]
  }
}
```

**Get single career posting**

```
GET /api/careers/:id

Response:
{
  "success": true,
  "data": {
    "id": "...",
    "title": "Senior Backend Engineer",
    "department": "Engineering",
    ...
  }
}
```

### Health Check

```
GET /health

Response:
{
  "status": "ok",
  "service": "contrezz-public-api",
  "timestamp": "2024-12-14T...",
  "uptime": 12345
}
```

## 🗄️ Database Schema

### career_postings

```sql
- id: UUID
- title: string
- department: string
- location: string
- type: string (Full-time, Part-time, Contract)
- remote: string (Remote, Hybrid, On-site)
- experience: string (Entry-level, Mid-level, Senior)
- description: text
- requirements: string[]
- responsibilities: string[]
- salary: string (optional)
- benefits: string[]
- status: string (active, draft, closed, archived)
- postedBy: string (admin user ID)
- postedAt: timestamp
- expiresAt: timestamp (optional)
- viewCount: integer
- applicationCount: integer
- metadata: json
- createdAt: timestamp
- updatedAt: timestamp
- deletedAt: timestamp (soft delete)
```

## 🔐 Security

### Rate Limiting

- **Window**: 15 minutes
- **Max Requests**: 100 per IP
- **Response**: 429 Too Many Requests

### CORS

- Only allows requests from configured origins
- No credentials/cookies accepted (public API)

### No Authentication

This API serves public content only. No authentication is required or accepted.

## 🚀 Deployment

### DigitalOcean App Platform

1. **Create App**

   - Connect GitHub repository
   - Select `public-backend` folder
   - Configure build and run commands

2. **Configure Environment Variables**

   ```
   NODE_ENV=production
   PORT=8080
   PUBLIC_DATABASE_URL=${public-db.DATABASE_URL}
   ALLOWED_ORIGINS=https://contrezz.com,https://www.contrezz.com
   ```

3. **Add Database**

   - Create managed PostgreSQL database
   - Link to app
   - Run migrations

4. **Configure Custom Domain**
   - Add domain: api.contrezz.com
   - Update DNS records
   - SSL auto-provisioned

See [DIGITALOCEAN_FULL_SEPARATION_GUIDE.md](../DIGITALOCEAN_FULL_SEPARATION_GUIDE.md) for complete guide.

## 📊 Monitoring

### Logs

```bash
# DigitalOcean CLI
doctl apps logs <app-id> --follow

# Or view in DigitalOcean dashboard
```

### Metrics

Monitor in DigitalOcean dashboard:

- CPU usage
- Memory usage
- Request rate
- Response times
- Error rates

### Alerts

Configure alerts for:

- High CPU (>80%)
- High memory (>80%)
- Error rate spike
- Deployment failures

## 🔄 Data Synchronization

Career postings are managed in the main application backend and synced to this public database. See sync service implementation in main app.

## 🧪 Testing

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage
```

## 📝 Environment Variables

| Variable                  | Description                  | Default     | Required |
| ------------------------- | ---------------------------- | ----------- | -------- |
| `NODE_ENV`                | Environment                  | development | Yes      |
| `PORT`                    | Server port                  | 5001        | Yes      |
| `PUBLIC_DATABASE_URL`     | PostgreSQL connection string | -           | Yes      |
| `ALLOWED_ORIGINS`         | CORS allowed origins         | -           | Yes      |
| `APP_URL`                 | Main app URL for redirects   | -           | No       |
| `RATE_LIMIT_WINDOW_MS`    | Rate limit window            | 900000      | No       |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window      | 100         | No       |

## 📚 Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm run migrate:dev` - Run database migrations (dev)
- `npm run migrate:deploy` - Run database migrations (prod)
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:studio` - Open Prisma Studio

## 🤝 Contributing

This is a separate backend with its own database. When adding new public content:

1. Add model to `prisma/schema.prisma`
2. Create migration: `npx prisma migrate dev --name add_feature`
3. Add service in `src/services/`
4. Add routes in `src/routes/`
5. Update main `src/index.ts`
6. Test locally
7. Deploy to DigitalOcean

## 📖 Additional Documentation

- [Main Project README](../README.md)
- [DigitalOcean Deployment Guide](../DIGITALOCEAN_FULL_SEPARATION_GUIDE.md)
- [Architecture Overview](../docs/ARCHITECTURE.md)

## 🆘 Support

For issues specific to this backend:

1. Check logs: `doctl apps logs <app-id>`
2. Verify database: `doctl databases get <db-id>`
3. Review DigitalOcean metrics
4. Contact team via Slack #backend-public

---

**Version**: 1.0.0
**Last Updated**: December 2024
