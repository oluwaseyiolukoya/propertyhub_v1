# 🎨 Prisma Studio Access Guide

This guide shows you how to access Prisma Studio to view and manage your dev database.

---

## 🚀 Quick Start

### Step 1: Ensure Dev Environment is Running

```bash
cd /Users/oluwaseyio/test_ui_figma_and_cursor/infra/scripts
./dev-control.sh status
```

If not running, start it:

```bash
./dev-control.sh start
```

### Step 2: Launch Prisma Studio

```bash
cd /Users/oluwaseyio/test_ui_figma_and_cursor/infra/scripts
./prisma-studio.sh
```

### Step 3: Open in Browser

Prisma Studio will automatically open at:
**http://localhost:5555**

---

## 📊 What You Can Do in Prisma Studio

### ✅ View Data
- Browse all tables
- See relationships between tables
- Filter and search records

### ✅ Edit Data
- Add new records
- Update existing records
- Delete records

### ✅ Explore Schema
- View table structures
- See field types and constraints
- Understand relationships

---

## 🔒 How It Works

The script:
1. ✅ Retrieves `DATABASE_URL` from AWS Secrets Manager
2. ✅ Connects directly to your RDS database (via NAT Gateway)
3. ✅ Launches Prisma Studio on your local machine
4. ✅ Opens web interface at `localhost:5555`

**Note**: Your database is in a private subnet, but the NAT Gateway allows outbound connections, so Prisma Studio on your local machine can connect to it.

---

## 🛑 Stop Prisma Studio

Press `Ctrl+C` in the terminal where Prisma Studio is running.

---

## 🎯 Common Use Cases

### 1. View All Customers

1. Open Prisma Studio
2. Click on **`customers`** table
3. Browse all customer records
4. Filter by status, plan, etc.

### 2. Check Admin Users

1. Click on **`admins`** table
2. See all admin accounts
3. Verify email and roles

### 3. Edit a Customer's MRR

1. Click on **`customers`** table
2. Find the customer
3. Click on the record
4. Edit the `mrr` field
5. Click **Save**

### 4. Add Test Data

1. Click on any table
2. Click **Add record**
3. Fill in the fields
4. Click **Save**

---

## 🔧 Alternative: Manual Connection

If the script doesn't work, you can manually connect:

### Step 1: Get Database URL

```bash
aws secretsmanager get-secret-value \
  --secret-id ph-dev-app-secrets \
  --region us-east-1 \
  --query SecretString \
  --output text | jq -r '.DATABASE_URL'
```

### Step 2: Set Environment Variable

```bash
export DATABASE_URL="postgresql://dbadmin:YOUR_PASSWORD@ph-dev-db.ccp20k04w2gl.us-east-1.rds.amazonaws.com:5432/contrezz"
```

### Step 3: Launch Prisma Studio

```bash
cd /Users/oluwaseyio/test_ui_figma_and_cursor/backend
npx prisma studio
```

---

## 🚨 Troubleshooting

### Issue 1: "Could not retrieve DATABASE_URL"

**Solution**: Ensure AWS CLI is configured and you have access to Secrets Manager:

```bash
aws secretsmanager get-secret-value \
  --secret-id ph-dev-app-secrets \
  --region us-east-1
```

### Issue 2: "Connection timeout"

**Solution**: Ensure dev environment is running:

```bash
cd /Users/oluwaseyio/test_ui_figma_and_cursor/infra/scripts
./dev-control.sh status
```

If RDS shows "stopped", start it:

```bash
./dev-control.sh start
```

### Issue 3: "Port 5555 already in use"

**Solution**: Another Prisma Studio instance is running. Find and kill it:

```bash
lsof -ti:5555 | xargs kill -9
```

Then try again.

### Issue 4: "Cannot connect to database"

**Possible causes:**
1. Database is stopped → Start dev environment
2. Wrong credentials → Check Secrets Manager
3. Network issue → Check your internet connection

---

## 🎯 Best Practices

### ✅ DO:
- Use Prisma Studio for **viewing** and **debugging** data
- Test queries and relationships
- Add test data for development
- Verify migrations applied correctly

### ⚠️ DON'T:
- Use Prisma Studio for **bulk operations** (use Prisma Client or SQL)
- Edit production data (when you have prod environment)
- Leave Prisma Studio running when not using it
- Share your `DATABASE_URL` publicly

---

## 📝 Example Workflow

### Scenario: Debug Customer MRR Issue

```bash
# 1. Start dev environment
cd /Users/oluwaseyio/test_ui_figma_and_cursor/infra/scripts
./dev-control.sh start

# 2. Open Prisma Studio
./prisma-studio.sh

# 3. In browser (http://localhost:5555):
#    - Click "customers" table
#    - Find customer with wrong MRR
#    - Check their "planId"
#    - Click "plans" table
#    - Verify plan's "monthlyPrice"
#    - Go back to "customers"
#    - Update MRR if needed

# 4. Close Prisma Studio (Ctrl+C)

# 5. Stop dev environment (save money)
./dev-control.sh stop
```

---

## 🔐 Security Notes

1. **Database URL contains password** - Never commit it to git
2. **Prisma Studio is local only** - Only accessible from your machine
3. **Dev database only** - This connects to dev, not production
4. **AWS credentials required** - Script uses your AWS CLI credentials

---

## 💡 Tips

### Tip 1: Quick Table Navigation
Use the search bar in Prisma Studio to quickly find tables.

### Tip 2: Filter Records
Click the filter icon to search for specific records.

### Tip 3: View Relationships
Click on foreign key fields to navigate to related records.

### Tip 4: Export Data
You can't export directly from Prisma Studio, but you can:

```bash
cd /Users/oluwaseyio/test_ui_figma_and_cursor/backend
export DATABASE_URL=$(aws secretsmanager get-secret-value --secret-id ph-dev-app-secrets --region us-east-1 --query SecretString --output text | jq -r '.DATABASE_URL')

# Export all customers to JSON
npx prisma db execute --stdin <<< "SELECT json_agg(row_to_json(t)) FROM (SELECT * FROM customers) t;" > customers.json
```

---

## 🎉 Summary

**To access Prisma Studio:**

```bash
# One command!
cd /Users/oluwaseyio/test_ui_figma_and_cursor/infra/scripts && ./prisma-studio.sh
```

Then open **http://localhost:5555** in your browser.

**That's it!** 🚀

---

## 📚 Related Documentation

- [Prisma Studio Docs](https://www.prisma.io/docs/concepts/components/prisma-studio)
- [DEPLOYMENT_SUCCESS.md](../DEPLOYMENT_SUCCESS.md) - Full deployment guide
- [dev-control.sh](./infra/scripts/dev-control.sh) - Start/stop dev environment

---

**Happy database exploring!** 🎨

