# Create Developer Plans - Guide

## 🎯 Problem Identified

**Root Cause:** Your production database has **ZERO developer plans**!

You only have 3 property management plans:
- Starter
- Professional
- Enterprise

That's why no plans show up when creating a Developer customer - there are no development plans to display!

---

## ✅ Solution: Create Developer Plans

I've created a script that will add 3 developer plans to your production database.

---

## 🏗️ Developer Plans to be Created

### 1. Developer Starter ($49.99/month)
- **Projects:** 3 active projects
- **Users:** 3 team members
- **Storage:** 5GB
- **Features:**
  - Project management dashboard
  - Budget tracking
  - Expense management
  - Vendor management
  - Basic reporting
  - Email support
- **Trial:** 14 days

### 2. Developer Professional ($149.99/month) ⭐ Popular
- **Projects:** 10 active projects
- **Users:** 10 team members
- **Storage:** 20GB
- **Features:**
  - Advanced project management
  - Budget vs actual tracking
  - Purchase order management
  - Project funding tracking
  - Advanced reporting & analytics
  - Custom reports
  - Priority email & phone support
- **Trial:** 14 days

### 3. Developer Enterprise ($399.99/month)
- **Projects:** Unlimited
- **Users:** Unlimited
- **Storage:** 100GB
- **Features:**
  - Enterprise project management
  - Multi-project reporting
  - Custom dashboards
  - API access
  - White-label options
  - Dedicated account manager
  - 24/7 priority support
  - Custom integrations
  - Training & onboarding
- **Trial:** 30 days

---

## 🚀 How to Create the Plans

### Step 1: Deploy the Script

**On your local machine:**

```bash
cd /Users/oluwaseyio/test_ui_figma_and_cursor

# Add and commit
git add backend/scripts/create-developer-plans.js CREATE_DEVELOPER_PLANS.md
git commit -m "feat: add script to create developer plans in production"
git push origin main
```

### Step 2: Wait for Deployment (5-10 minutes)

Monitor at: https://cloud.digitalocean.com/apps

Wait for status: **✅ Active**

### Step 3: Run the Script in Production

**In DigitalOcean Console:**

```bash
cd /workspace/backend
node scripts/create-developer-plans.js
```

**Expected Output:**

```
🏗️  Creating Developer Plans
================================================

📋 Plans to create:

  🏗️  Developer Starter
     Price: $49.99/month or $499.99/year
     Projects: 3
     Users: 3
     Storage: 5GB

  🏗️  Developer Professional
     Price: $149.99/month or $1499.99/year
     Projects: 10
     Users: 10
     Storage: 20GB

  🏗️  Developer Enterprise
     Price: $399.99/month or $3999.99/year
     Projects: Unlimited
     Users: Unlimited
     Storage: 100GB

🔧 Creating plans...

  ✅ Created: Developer Starter (ID: xxx)
  ✅ Created: Developer Professional (ID: xxx)
  ✅ Created: Developer Enterprise (ID: xxx)

═════════════════════════════════════════════════════════
✅ Developer plans created successfully!
═════════════════════════════════════════════════════════

📊 All Plans in Database:

🏗️  Development Plans:
  - Developer Starter ($49.99/mo, 3 projects)
  - Developer Professional ($149.99/mo, 10 projects)
  - Developer Enterprise ($399.99/mo, 999 projects)

🏢 Property Management Plans:
  - Starter ($XX/mo, 5 properties)
  - Professional ($XX/mo, 20 properties)
  - Enterprise ($XX/mo, 100 properties)

📈 Summary:
  🏗️  Development Plans: 3
  🏢 Property Management Plans: 3
  📊 Total Plans: 6
```

---

## ✅ Verification

After running the script:

### Test 1: Create Developer Customer

1. Go to https://contrezz.com/admin
2. Click **"Add Customer"**
3. Select **Customer Type: Property Developer**
4. Check the **Plan** dropdown

**Expected:** ✅ You should now see 3 developer plans!

### Test 2: Verify in Database

**Option A: Using Prisma Studio**
```bash
DATABASE_URL="your-production-url" npx prisma studio
```

**Option B: Using Console**
```bash
cd /workspace/backend
node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.plans.findMany({ where: { category: 'development' } }).then(plans => { console.log('Developer Plans:', plans.length); plans.forEach(p => console.log('  -', p.name)); prisma.\$disconnect(); });"
```

---

## 💰 Pricing Considerations

The script uses USD pricing. You can adjust prices by:

### Option 1: Edit the Script Before Deploying

Edit `backend/scripts/create-developer-plans.js` and change:
- `monthlyPrice`
- `annualPrice`
- `currency`

### Option 2: Update After Creation

Use Prisma Studio or the admin dashboard to update prices.

### Suggested Pricing Tiers

**If you want NGN (Nigerian Naira):**
- Developer Starter: ₦25,000/month
- Developer Professional: ₦75,000/month
- Developer Enterprise: ₦200,000/month

**To change currency, edit the script:**
```javascript
currency: 'NGN',
monthlyPrice: 25000,
annualPrice: 250000,
```

---

## 🔧 Customization

### Change Project Limits

Edit in the script:
```javascript
projectLimit: 5,  // Change this number
```

### Change Features

Edit the `features` array:
```javascript
features: [
  'Your feature 1',
  'Your feature 2',
  // Add or remove features
]
```

### Change Trial Period

Edit:
```javascript
trialDurationDays: 14,  // Change to 7, 30, etc.
```

---

## 🆘 Troubleshooting

### Issue: Plans Already Exist

**Message:** `Plan "Developer Starter" already exists, skipping...`

**Solution:** The script is smart and won't create duplicates. If you want to recreate, delete the existing plans first via Prisma Studio.

### Issue: Script Not Found

**Solution:** Make sure deployment completed. Check:
```bash
ls -la /workspace/backend/scripts/create-developer-plans.js
```

### Issue: Wrong Currency

**Solution:** After creation, update via Prisma Studio or create a new script to update currency.

---

## 📋 Quick Commands

**Deploy:**
```bash
git add backend/scripts/create-developer-plans.js CREATE_DEVELOPER_PLANS.md
git commit -m "feat: add developer plans creation script"
git push origin main
```

**Run in Production:**
```bash
cd /workspace/backend
node scripts/create-developer-plans.js
```

**Test:**
https://contrezz.com/admin → Add Customer → Select "Property Developer"

---

## ✨ Summary

**Problem:** No developer plans exist in production  
**Solution:** Run script to create 3 developer plans  
**Plans:** Starter ($49.99), Professional ($149.99), Enterprise ($399.99)  
**Result:** Developer customers can now select plans! 🎉

---

## 🎉 After This Fix

You'll have a complete set of plans:

**For Property Owners/Managers:**
- ✅ Starter
- ✅ Professional
- ✅ Enterprise

**For Property Developers:**
- ✅ Developer Starter
- ✅ Developer Professional
- ✅ Developer Enterprise

**Total:** 6 plans covering all customer types! 🚀

