# 🔄 Auto-Sync Prisma on Every Deployment

## 🎯 **Goal:**

Ensure Prisma schema is always synced with the database after each deployment to DigitalOcean.

---

## ✅ **Solution: Add Post-Deployment Script**

### **Method 1: Using package.json Scripts (Recommended)**

Add these scripts to your `backend/package.json`:

```json
{
  "scripts": {
    "start": "node dist/index.js",
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "postinstall": "prisma generate",
    "deploy": "npm run build && npm run db:push",
    "db:push": "prisma db push --accept-data-loss",
    "db:migrate": "prisma migrate deploy",
    "prisma:sync": "prisma generate && prisma db push"
  }
}
```

**What each script does:**

- `postinstall` - Automatically runs after `npm install` (generates Prisma Client)
- `deploy` - Build and sync database
- `db:push` - Push schema changes to database
- `db:migrate` - Apply migrations (alternative to db:push)
- `prisma:sync` - Generate client and sync schema

---

## 🚀 **Method 2: Create Deployment Script**

Create `backend/deploy.sh`:

```bash
#!/bin/bash

echo "🚀 Starting deployment process..."

# Exit on any error
set -e

# Pull latest code
echo "📥 Pulling latest code from GitHub..."
git pull origin main

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Generate Prisma Client
echo "🔨 Generating Prisma Client..."
npx prisma generate

# Sync database schema
echo "🗄️ Syncing database schema..."
npx prisma db push --accept-data-loss

# Build TypeScript
echo "🏗️ Building application..."
npm run build

# Restart service
echo "🔄 Restarting backend service..."
if command -v pm2 &> /dev/null; then
    pm2 restart backend
elif systemctl is-active --quiet backend; then
    sudo systemctl restart backend
else
    echo "⚠️ Please restart your backend service manually"
fi

echo "✅ Deployment complete!"
echo "📊 Check logs: pm2 logs backend"
```

**Make it executable:**

```bash
chmod +x backend/deploy.sh
```

**Use it:**

```bash
cd /path/to/backend
./deploy.sh
```

---

## 🤖 **Method 3: GitHub Actions (CI/CD)**

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to DigitalOcean

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Deploy to DigitalOcean
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.DO_HOST }}
          username: ${{ secrets.DO_USERNAME }}
          key: ${{ secrets.DO_SSH_KEY }}
          script: |
            cd /path/to/your/backend
            git pull origin main
            npm install
            npx prisma generate
            npx prisma db push --accept-data-loss
            npm run build
            pm2 restart backend
```

**Setup:**

1. Go to GitHub repo → Settings → Secrets
2. Add secrets:
   - `DO_HOST` - Your server IP
   - `DO_USERNAME` - SSH username (e.g., root)
   - `DO_SSH_KEY` - Your private SSH key

**Result:** Every push to `main` automatically deploys and syncs Prisma!

---

## 🔧 **Method 4: PM2 Ecosystem File**

Create `backend/ecosystem.config.js`:

```javascript
module.exports = {
  apps: [
    {
      name: "backend",
      script: "./dist/index.js",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 5000,
      },
      post_update: [
        "npm install",
        "npx prisma generate",
        "npx prisma db push --accept-data-loss",
        "npm run build",
      ],
    },
  ],

  deploy: {
    production: {
      user: "root",
      host: "your-server-ip",
      ref: "origin/main",
      repo: "git@github.com:yourusername/yourrepo.git",
      path: "/var/www/propertyhub",
      "post-deploy":
        "cd backend && npm install && npx prisma generate && npx prisma db push --accept-data-loss && npm run build && pm2 reload ecosystem.config.js --env production",
      "pre-setup": "",
    },
  },
};
```

**Deploy with:**

```bash
# First time setup
pm2 deploy ecosystem.config.js production setup

# Deploy updates
pm2 deploy ecosystem.config.js production
```

---

## 🐳 **Method 5: Docker with Entrypoint Script**

If using Docker, create `backend/docker-entrypoint.sh`:

```bash
#!/bin/bash
set -e

echo "🔨 Generating Prisma Client..."
npx prisma generate

echo "🗄️ Syncing database schema..."
npx prisma db push --accept-data-loss

echo "🚀 Starting application..."
exec "$@"
```

**Update `Dockerfile`:**

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Build application
RUN npm run build

# Copy and set entrypoint
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 5000

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "dist/index.js"]
```

**Update `docker-compose.yml`:**

```yaml
version: "3.8"

services:
  backend:
    build: ./backend
    restart: always
    ports:
      - "5000:5000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - NODE_ENV=production
    depends_on:
      - postgres
    volumes:
      - ./backend/prisma:/app/prisma

  postgres:
    image: postgres:15-alpine
    restart: always
    environment:
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      - POSTGRES_DB=${DB_NAME}
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

**Deploy:**

```bash
docker-compose up -d --build
```

---

## 📋 **Method 6: Simple Cron Job**

Create a cron job to check and sync daily:

```bash
# Edit crontab
crontab -e

# Add this line (runs daily at 2 AM)
0 2 * * * cd /path/to/backend && npx prisma generate && npx prisma db push --accept-data-loss >> /var/log/prisma-sync.log 2>&1
```

**Or create a sync script** `backend/sync-prisma.sh`:

```bash
#!/bin/bash
cd /path/to/backend
npx prisma generate
npx prisma db push --accept-data-loss
echo "✅ Prisma synced at $(date)" >> /var/log/prisma-sync.log
```

---

## 🎯 **Recommended Setup for DigitalOcean:**

### **Best Practice: Combine Methods 1 & 2**

**1. Update `package.json`:**

```json
{
  "scripts": {
    "start": "node dist/index.js",
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "postinstall": "prisma generate",
    "predeploy": "npm run build",
    "deploy": "npm run db:sync && pm2 restart backend",
    "db:sync": "prisma generate && prisma db push --accept-data-loss"
  }
}
```

**2. Create `backend/deploy.sh`:**

```bash
#!/bin/bash
set -e

echo "🚀 Deploying backend..."

# Pull latest code
git pull origin main

# Run deployment
npm install
npm run deploy

echo "✅ Deployment complete!"
```

**3. Make it executable:**

```bash
chmod +x backend/deploy.sh
```

**4. Deploy with one command:**

```bash
cd /path/to/backend
./deploy.sh
```

---

## ⚙️ **Automatic Deployment Webhook (Advanced)**

Set up a webhook to auto-deploy on git push:

**1. Create webhook handler** `backend/webhook-deploy.js`:

```javascript
const express = require("express");
const { exec } = require("child_process");
const crypto = require("crypto");

const app = express();
app.use(express.json());

const SECRET = process.env.WEBHOOK_SECRET || "your-secret-here";

app.post("/deploy", (req, res) => {
  // Verify GitHub signature
  const signature = req.headers["x-hub-signature-256"];
  const hash = crypto
    .createHmac("sha256", SECRET)
    .update(JSON.stringify(req.body))
    .digest("hex");

  if (signature !== `sha256=${hash}`) {
    return res.status(401).send("Invalid signature");
  }

  console.log("🚀 Deployment triggered by GitHub webhook");

  // Run deployment script
  exec("cd /path/to/backend && ./deploy.sh", (error, stdout, stderr) => {
    if (error) {
      console.error("❌ Deployment failed:", error);
      return res.status(500).send("Deployment failed");
    }
    console.log("✅ Deployment successful");
    console.log(stdout);
    res.send("Deployment started");
  });
});

app.listen(3001, () => {
  console.log("🎣 Webhook server listening on port 3001");
});
```

**2. Run with PM2:**

```bash
pm2 start webhook-deploy.js --name webhook
pm2 save
```

**3. Configure GitHub webhook:**

- Go to GitHub repo → Settings → Webhooks
- Add webhook: `http://your-server-ip:3001/deploy`
- Secret: Your webhook secret
- Events: Just the push event

**4. Set up nginx reverse proxy:**

```nginx
location /deploy {
    proxy_pass http://localhost:3001;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}
```

---

## ✅ **Verification Checklist:**

After setting up auto-sync, verify:

- [ ] `postinstall` script runs after `npm install`
- [ ] Deployment script exists and is executable
- [ ] `prisma generate` runs successfully
- [ ] `prisma db push` syncs schema
- [ ] Backend restarts after deployment
- [ ] Changes reflect in production
- [ ] Logs show successful sync

---

## 🧪 **Test Your Setup:**

```bash
# 1. Make a small schema change locally
# Edit backend/prisma/schema.prisma

# 2. Commit and push
git add backend/prisma/schema.prisma
git commit -m "test: update schema"
git push origin main

# 3. SSH into server and deploy
ssh root@your-server-ip
cd /path/to/backend
./deploy.sh

# 4. Verify schema was synced
npx prisma db pull
# Should match your local schema

# 5. Check logs
pm2 logs backend
```

---

## 📊 **Comparison of Methods:**

| Method               | Complexity        | Automation | Best For        |
| -------------------- | ----------------- | ---------- | --------------- |
| package.json scripts | ⭐ Easy           | Manual     | Simple setups   |
| Deployment script    | ⭐⭐ Easy         | Manual     | Most projects   |
| GitHub Actions       | ⭐⭐⭐ Medium     | Full       | CI/CD pipelines |
| PM2 Ecosystem        | ⭐⭐ Easy         | Semi       | PM2 users       |
| Docker Entrypoint    | ⭐⭐⭐ Medium     | Full       | Docker setups   |
| Webhook              | ⭐⭐⭐⭐ Advanced | Full       | Auto-deploy     |

---

## 🎯 **My Recommendation:**

**For your DigitalOcean setup, use Method 1 + 2:**

1. ✅ Add scripts to `package.json`
2. ✅ Create `deploy.sh` script
3. ✅ Run `./deploy.sh` after each git push

**Later, upgrade to:**

- GitHub Actions (Method 3) for full automation
- Or Webhook (Method 6) for instant deployments

---

## 🚀 **Quick Setup (Copy-Paste):**

```bash
# 1. SSH into your server
ssh root@your-server-ip

# 2. Navigate to backend
cd /path/to/backend

# 3. Create deployment script
cat > deploy.sh << 'EOF'
#!/bin/bash
set -e
echo "🚀 Deploying backend..."
git pull origin main
npm install
npx prisma generate
npx prisma db push --accept-data-loss
npm run build
pm2 restart backend
echo "✅ Deployment complete!"
EOF

# 4. Make it executable
chmod +x deploy.sh

# 5. Test it
./deploy.sh
```

**Now, every time you push code:**

```bash
ssh root@your-server-ip
cd /path/to/backend
./deploy.sh
```

---

## 📝 **Add to Your Workflow:**

```bash
# Local development
git add .
git commit -m "feat: new feature"
git push origin main

# Production deployment
ssh root@your-server-ip
cd /path/to/backend
./deploy.sh
```

---

**That's it! Prisma will always be synced on every deployment!** 🎉

Would you like me to help you set up any of these methods?
