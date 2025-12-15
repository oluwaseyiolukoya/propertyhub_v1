# Best Practices for Public Admin System

## 🔒 Security Best Practices

### 1. Secrets Management

**❌ NEVER commit secrets to git:**

- `.env` files
- `.env.bak`, `.env.backup` files
- Database passwords
- API keys
- JWT secrets

**✅ DO:**

- Add `.env*` to `.gitignore`
- Use environment variables in production
- Use secret management services (DigitalOcean App Platform secrets, AWS Secrets Manager, etc.)
- Rotate secrets regularly
- Use different secrets for development and production

**If you accidentally commit a secret:**

1. **Immediate action:** Rotate the secret (change password/API key)
2. **Remove from git history:** Use `git filter-branch` or BFG Repo-Cleaner
3. **For GitHub:** Use the "Allow secret" option only if it's a false positive (test/example value)

---

### 2. Environment Variables

**Structure:**

```env
# Development (.env - NOT committed)
PUBLIC_ADMIN_JWT_SECRET=dev-secret-key-minimum-32-chars
PUBLIC_ADMIN_JWT_EXPIRES_IN=24h
ALLOWED_ORIGINS=http://localhost:5173

# Production (Set in DigitalOcean App Platform)
PUBLIC_ADMIN_JWT_SECRET=<strong-production-secret>
PUBLIC_ADMIN_JWT_EXPIRES_IN=24h
ALLOWED_ORIGINS=https://admin.contrezz.com
```

**Best Practices:**

- Generate strong secrets (minimum 32 characters, random)
- Use different secrets per environment
- Never log secrets
- Validate required env vars at startup
- Use `.env.example` file (without real values) for documentation

---

## 📝 TypeScript Best Practices

### 1. Return Types

**✅ DO:**

```typescript
// Explicit return types for async route handlers
async (req: Request, res: Response): Promise<Response | void> => {
  try {
    // ... logic
    return res.json({ data });
  } catch (error) {
    return res.status(500).json({ error });
  }
};
```

**❌ DON'T:**

```typescript
// Missing return statements
async (req: Request, res: Response) => {
  try {
    res.json({ data }); // Missing return
  } catch (error) {
    res.status(500).json({ error }); // Missing return
  }
};
```

### 2. Type Safety

**✅ DO:**

```typescript
// Proper type assertions for JWT
import jwt, { SignOptions } from "jsonwebtoken";

const secret = process.env.JWT_SECRET;
if (!secret || typeof secret !== "string") {
  throw new Error("JWT_SECRET not configured");
}

const token = jwt.sign(payload, secret, {
  expiresIn: "24h",
} as SignOptions);
```

**❌ DON'T:**

```typescript
// Unsafe type assertions
const token = jwt.sign(payload, process.env.JWT_SECRET, {
  expiresIn: process.env.EXPIRES_IN, // Type error
});
```

### 3. Error Handling

**✅ DO:**

```typescript
// Always return in catch blocks
try {
  // ... logic
  return res.json({ success: true });
} catch (error: any) {
  console.error("Operation failed:", error);
  return res.status(500).json({
    error: error.message || "Internal server error",
  });
}
```

---

## 🗄️ Database Best Practices

### 1. Migrations

**✅ ALWAYS:**

- Edit `schema.prisma` first
- Create migration: `npx prisma migrate dev --name description`
- Review generated SQL
- Test locally before committing
- Commit migration files immediately

**❌ NEVER:**

- Manually create/alter tables
- Use `prisma db push` when migrations exist
- Edit migration files after creation
- Delete migration files

### 2. Schema Design

**✅ DO:**

- Use UUIDs for primary keys
- Add indexes for frequently queried fields
- Use proper foreign key constraints
- Add timestamps (`createdAt`, `updatedAt`)
- Use enums for fixed value sets

---

## 🚀 Deployment Best Practices

### 1. Build Process

**✅ DO:**

- Test build locally before pushing
- Use TypeScript strict mode
- Run linter before committing
- Ensure all dependencies are in `package.json`
- Move type definitions to `dependencies` if needed at build time

**Build command:**

```json
{
  "scripts": {
    "build": "tsc",
    "prisma:generate": "prisma generate"
  }
}
```

### 2. Environment Configuration

**✅ DO:**

- Set all environment variables in DigitalOcean App Platform
- Use different values for dev/staging/production
- Document required variables in README
- Validate env vars at application startup

**Example validation:**

```typescript
const requiredEnvVars = ["PUBLIC_ADMIN_JWT_SECRET", "PUBLIC_DATABASE_URL"];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}
```

---

## 🔐 Authentication Best Practices

### 1. JWT Tokens

**✅ DO:**

- Use strong, random secrets (minimum 32 characters)
- Set appropriate expiration times (24h for admin sessions)
- Store sessions in database for revocation
- Validate tokens on every request
- Check session expiration
- Log out on token expiration

**✅ DO:**

- Hash passwords with bcrypt (cost factor 10+)
- Never store plain text passwords
- Use salt rounds: 10-12 for production
- Validate password strength (min 8 chars, complexity)

---

## 📁 Code Organization

### 1. File Structure

**✅ DO:**

```
public-backend/
├── src/
│   ├── routes/
│   │   └── admin/
│   │       ├── auth.ts
│   │       ├── landing-pages.ts
│   │       └── careers.ts
│   ├── services/
│   │   └── admin.service.ts
│   ├── middleware/
│   │   └── adminAuth.ts
│   └── lib/
│       └── db.ts
├── prisma/
│   └── schema.prisma
└── scripts/
    └── create-first-admin.ts
```

### 2. Separation of Concerns

**✅ DO:**

- Routes: Handle HTTP requests/responses
- Services: Business logic
- Middleware: Authentication, validation
- Models: Database schema (Prisma)

---

## 🧪 Testing Best Practices

### 1. Before Deployment

**✅ ALWAYS:**

- Test locally first
- Verify TypeScript compilation
- Test all API endpoints
- Test authentication flow
- Test error handling
- Check database migrations

### 2. Production Testing

**✅ DO:**

- Test with production-like data
- Verify environment variables
- Test SSL certificates
- Test CORS configuration
- Monitor error logs

---

## 📊 Monitoring & Logging

### 1. Logging

**✅ DO:**

- Log errors with context
- Log authentication attempts
- Log admin actions (activity logs)
- Use structured logging
- Don't log sensitive data (passwords, tokens)

**Example:**

```typescript
console.error("Admin login failed:", {
  email: req.body.email,
  ip: req.ip,
  timestamp: new Date().toISOString(),
});
```

### 2. Error Handling

**✅ DO:**

- Return appropriate HTTP status codes
- Provide clear error messages (not stack traces in production)
- Log detailed errors server-side
- Use consistent error response format

---

## 🔄 Git Workflow Best Practices

### 1. Commit Messages

**✅ DO:**

```
feat: add public admin authentication
fix: resolve TypeScript build errors
docs: update deployment guide
refactor: reorganize admin routes
```

**Format:** `type: description`

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `refactor`: Code restructuring
- `test`: Tests
- `chore`: Maintenance

### 2. Branch Strategy

**✅ DO:**

- Use `main` for production-ready code
- Create feature branches for new features
- Test locally before pushing
- Review changes before merging

---

## 🚨 Handling Secrets in Git History

### If You Accidentally Commit a Secret:

**Option 1: Rotate Secret (Recommended)**

1. Change the secret immediately
2. Update environment variables
3. Deploy with new secret
4. Document the incident

**Option 2: Remove from History**

```bash
# Using git filter-branch (destructive)
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch public-backend/.env.bak" \
  --prune-empty --tag-name-filter cat -- --all

# Force push (coordinate with team)
git push origin --force --all
```

**Option 3: Use GitHub's Allow Secret (Quick Fix)**

- Only if it's a false positive or test value
- Visit the GitHub URL provided in error
- Click "Allow secret"
- **Still rotate the secret** if it's real

---

## ✅ Checklist Before Deployment

- [ ] All TypeScript errors resolved
- [ ] All tests pass locally
- [ ] Environment variables set in production
- [ ] Database migrations applied
- [ ] Secrets rotated (if needed)
- [ ] CORS configured correctly
- [ ] SSL certificates valid
- [ ] Error handling tested
- [ ] Authentication flow tested
- [ ] Documentation updated

---

## 📚 Additional Resources

- [Prisma Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization)
- [Express.js Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [JWT Best Practices](https://datatracker.ietf.org/doc/html/rfc8725)
- [TypeScript Best Practices](https://typescript-eslint.io/rules/)

---

**Last Updated:** December 15, 2025  
**Status:** Best practices guide for public admin system
