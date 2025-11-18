# 🚀 Pricing Plans Sync - Quick Start Guide

Get your pricing plans synced from the landing page to the admin dashboard in 3 easy steps!

---

## ⚡ **Quick Steps**

### **Step 1: Navigate to Admin Dashboard**

1. Log in as Super Admin
2. Go to **Billing & Plans** section
3. Click on **Plans** tab

---

### **Step 2: Sync Pricing Plans**

1. Click the **"Sync from Landing Page"** button
2. Wait for the sync to complete (usually < 5 seconds)
3. See success message: "Successfully synced! X created, Y updated"

---

### **Step 3: Verify**

1. Check the plans list - you should see 6 plans:
   - **Property Owners**: Starter, Professional, Business
   - **Property Developers**: Project Lite, Project Pro, Project Enterprise

2. Each plan shows:
   - ✅ Name and description
   - ✅ Monthly and annual pricing
   - ✅ Limits (properties/projects, users, storage)
   - ✅ Features list
   - ✅ Active status
   - ✅ Popular badge (if applicable)

---

## 🎯 **What Gets Synced**

### **Property Owner Plans:**

| Plan | Price | Properties | Units | Users |
|------|-------|------------|-------|-------|
| Starter | ₦9,900/mo | 1 | 20 | 2 |
| Professional | ₦29,900/mo | 5 | 200 | 6 |
| Business | ₦69,900/mo | 15 | 500 | 15 |

### **Property Developer Plans:**

| Plan | Price | Projects | Users |
|------|-------|----------|-------|
| Project Lite | ₦14,900/mo | 1 | 3 |
| Project Pro | ₦39,900/mo | 3 | 8 |
| Project Enterprise | ₦99,900/mo | 10 | Unlimited |

---

## 🔄 **When to Sync**

Sync pricing plans whenever you:

- ✅ Update prices on the landing page
- ✅ Add or remove features
- ✅ Change plan descriptions
- ✅ Modify limits (properties, users, storage)
- ✅ Set up the system for the first time

---

## 💡 **Tips**

### **First Time Setup:**

1. Sync immediately after deployment
2. Verify all 6 plans are created
3. Check that popular plans are marked correctly

### **Regular Updates:**

1. Update `src/types/pricing.ts` first
2. Test changes on landing page
3. Then sync to admin dashboard

### **Safety:**

- ✅ Existing customer assignments are preserved
- ✅ Active subscriptions continue unaffected
- ✅ Only plan details are updated

---

## ❓ **FAQs**

### **Q: How long does sync take?**
A: Usually 2-5 seconds for all 6 plans.

### **Q: Will this affect existing customers?**
A: No, customer assignments and subscriptions remain intact.

### **Q: Can I sync multiple times?**
A: Yes! Sync as many times as needed. It's safe and idempotent.

### **Q: What if sync fails?**
A: Check your admin permissions and database connection. See the full documentation for troubleshooting.

### **Q: Do I need to restart the server?**
A: No, sync happens in real-time without restart.

---

## 🎊 **That's It!**

Your pricing plans are now dynamically connected between the landing page and admin dashboard.

**Update once, sync once, manage everywhere!** 🚀

---

## 📚 **Need More Help?**

See the complete documentation:
- `docs/PRICING_PLANS_DYNAMIC_SYNC.md` - Full technical documentation
- `docs/DUAL_PRICING_IMPLEMENTATION.md` - Pricing structure details
- `docs/PRICING_VISUAL_GUIDE.md` - Visual design reference

