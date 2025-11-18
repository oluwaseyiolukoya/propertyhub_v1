# 🔄 Dynamic Pricing Plans - Landing Page to Admin Dashboard Sync

Complete implementation of dynamic pricing plan synchronization between the landing page and the Admin Dashboard Billing & Plans section.

---

## 📋 **Overview**

The pricing plans displayed on the landing page are now dynamically connected to the database and can be managed through the Admin Dashboard. This creates a single source of truth for all pricing information.

---

## 🏗️ **Architecture**

### **Data Flow:**

```
Landing Page Pricing Data (src/types/pricing.ts)
           ↓
    Sync Service (backend)
           ↓
    Database (plans table)
           ↓
    Admin Dashboard (Billing & Plans)
           ↓
    Customer Assignments
```

---

## 📁 **Files Created/Modified**

### **Backend:**

1. **`backend/src/services/pricing-sync.service.ts`** ✨ NEW
   - Syncs pricing data from code to database
   - Converts pricing structure to database schema
   - Handles property owner and developer plans separately

2. **`backend/src/routes/pricing-sync.ts`** ✨ NEW
   - API endpoint for syncing plans
   - Admin-only access
   - Returns sync statistics

3. **`backend/src/index.ts`** ✏️ MODIFIED
   - Registered pricing-sync routes

### **Frontend:**

4. **`src/lib/api/pricing-sync.ts`** ✨ NEW
   - Frontend API client for pricing sync
   - Handles sync requests and plan fetching

5. **`src/components/BillingPlansAdmin.tsx`** ✏️ MODIFIED
   - Added "Sync from Landing Page" button
   - Added sync handler function
   - Displays sync status with loading animation

---

## 🎯 **Features**

### **1. One-Click Sync**

Admins can sync all pricing plans from the landing page to the database with a single click.

**Button Location:**
- Admin Dashboard → Billing & Plans → Plans Tab
- Button: "Sync from Landing Page"

**What It Does:**
- ✅ Creates new plans if they don't exist
- ✅ Updates existing plans with latest data
- ✅ Maintains customer assignments
- ✅ Preserves plan IDs for consistency
- ✅ Shows sync statistics (created/updated)

---

### **2. Automatic Data Mapping**

The sync service automatically converts landing page pricing data to database format:

| Landing Page Field | Database Field | Conversion |
|-------------------|----------------|------------|
| `price` | `monthlyPrice` | Direct |
| `price * 10` | `annualPrice` | 12 months - 2 free |
| `userType: 'property-owner'` | `category: 'property_management'` | Mapping |
| `userType: 'property-developer'` | `category: 'development'` | Mapping |
| `limits.properties` | `propertyLimit` | Direct |
| `limits.projects` | `projectLimit` | Direct |
| `limits.users` | `userLimit` | Direct |
| `limits.storage` | `storageLimit` | Convert to MB |
| `features` (included only) | `features` JSON | Filter |
| `popular` | `isPopular` | Direct |

---

### **3. Smart Storage Conversion**

```typescript
// Landing Page
storage: "5GB"  → Database: 5120 MB
storage: "25GB" → Database: 25600 MB
storage: "Unlimited" → Database: 999999 MB
```

---

### **4. Plan Categories**

**Property Owner Plans:**
- Category: `property_management`
- Plans: Starter, Professional, Business
- Limits: Properties, Units, Users, Storage

**Property Developer Plans:**
- Category: `development`
- Plans: Project Lite, Project Pro, Project Enterprise
- Limits: Projects, Users, Storage

---

## 🚀 **How to Use**

### **Step 1: Update Pricing on Landing Page**

Edit `src/types/pricing.ts`:

```typescript
{
  id: 'professional',
  name: 'Professional',
  price: 29900, // Update price
  limits: {
    properties: 5, // Update limits
    units: 200,
    users: 6,
    storage: '25GB',
  },
  features: [
    { text: '5 properties', included: true },
    // Add/remove features
  ],
}
```

---

### **Step 2: Sync to Database**

1. **Navigate to Admin Dashboard**
   - Go to: Billing & Plans → Plans Tab

2. **Click "Sync from Landing Page"**
   - Button shows loading spinner during sync
   - Toast notification shows progress

3. **Review Results**
   - Success message shows: "Successfully synced! X created, Y updated"
   - Plans table refreshes automatically

---

### **Step 3: Verify in Database**

The synced plans are now in the `plans` table:

```sql
SELECT * FROM plans WHERE category = 'property_management';
SELECT * FROM plans WHERE category = 'development';
```

---

## 📊 **Database Schema**

### **Plans Table:**

```prisma
model plans {
  id                String    @id
  name              String    @unique
  description       String?
  category          String    @default("property_management")
  monthlyPrice      Float
  annualPrice       Float
  currency          String    @default("NGN")
  propertyLimit     Int?      // For property owners
  projectLimit      Int?      // For developers
  userLimit         Int
  storageLimit      Int       // In MB
  features          Json      // Array of feature strings
  isActive          Boolean   @default(true)
  isPopular         Boolean   @default(false)
  createdAt         DateTime  @default(now())
  updatedAt         DateTime
  customers         customers[]
}
```

---

## 🔌 **API Endpoints**

### **1. Sync Pricing Plans**

```http
POST /api/pricing-sync/sync
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully synced pricing plans: 3 created, 3 updated",
  "data": {
    "created": 3,
    "updated": 3
  }
}
```

---

### **2. Get Pricing Plans**

```http
GET /api/pricing-sync/plans?category=property_management
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "starter",
      "name": "Starter",
      "category": "property_management",
      "monthlyPrice": 9900,
      "annualPrice": 99000,
      "currency": "NGN",
      "propertyLimit": 1,
      "userLimit": 2,
      "storageLimit": 5120,
      "features": ["1 property", "1 property manager", ...],
      "isActive": true,
      "isPopular": false,
      "_count": {
        "customers": 5
      }
    }
  ]
}
```

---

## 🎨 **UI Components**

### **Sync Button:**

```tsx
<Button 
  variant="outline" 
  onClick={handleSyncPricingPlans}
  disabled={isSyncing}
>
  <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
  {isSyncing ? 'Syncing...' : 'Sync from Landing Page'}
</Button>
```

**States:**
- **Normal**: "Sync from Landing Page" with static icon
- **Loading**: "Syncing..." with spinning icon
- **Disabled**: Button disabled during sync

---

## 🔄 **Sync Process**

### **Step-by-Step:**

1. **Fetch Current Plans**
   - Service reads pricing data from `src/types/pricing.ts`
   - Combines Property Owner and Developer plans

2. **Check Existing Plans**
   - For each plan, check if it exists in database
   - Match by ID or name + category

3. **Create or Update**
   - **New Plan**: Create with generated ID
   - **Existing Plan**: Update all fields except ID

4. **Preserve Relationships**
   - Customer assignments remain intact
   - Plan IDs don't change
   - Active subscriptions continue

5. **Return Statistics**
   - Count of created plans
   - Count of updated plans
   - Any errors encountered

---

## ⚠️ **Important Notes**

### **1. Customer Safety**

✅ **Safe Operations:**
- Updating plan prices
- Adding/removing features
- Changing descriptions
- Updating limits

❌ **Avoid:**
- Deleting plans with active customers
- Changing plan IDs manually
- Modifying category after creation

---

### **2. Pricing Updates**

When you update prices on the landing page and sync:

**Existing Customers:**
- Keep their current plan and price
- Not automatically upgraded/downgraded
- Must manually change plan to get new pricing

**New Customers:**
- See updated pricing immediately
- Subscribe at new rates

---

### **3. Feature Changes**

**Adding Features:**
- Existing customers get new features automatically
- No action required

**Removing Features:**
- Consider impact on existing customers
- May need migration plan

---

## 🧪 **Testing**

### **Test Sync Functionality:**

1. **Initial Sync**
   ```bash
   # All plans should be created
   Expected: "6 created, 0 updated"
   ```

2. **Update Sync**
   ```bash
   # Change a price in pricing.ts
   # Re-sync
   Expected: "0 created, 1 updated"
   ```

3. **No Changes Sync**
   ```bash
   # Sync without changes
   Expected: "0 created, 6 updated" (timestamps updated)
   ```

---

### **Test Database State:**

```sql
-- Check all plans
SELECT id, name, category, monthlyPrice, isActive, isPopular 
FROM plans 
ORDER BY category, monthlyPrice;

-- Check customer assignments
SELECT c.company, p.name, p.monthlyPrice 
FROM customers c 
JOIN plans p ON c.planId = p.id 
WHERE p.category = 'property_management';
```

---

## 📈 **Benefits**

### **1. Single Source of Truth**

✅ Pricing defined once in code
✅ Automatically synced to database
✅ Admin dashboard always up-to-date
✅ No manual database updates needed

---

### **2. Version Control**

✅ Pricing changes tracked in Git
✅ Easy to review pricing history
✅ Rollback capability
✅ Team collaboration on pricing

---

### **3. Consistency**

✅ Landing page matches database
✅ Admin dashboard shows real data
✅ Customer assignments use correct plans
✅ No pricing discrepancies

---

### **4. Easy Updates**

✅ Update pricing in one place
✅ One-click sync to database
✅ Immediate reflection in admin
✅ No downtime required

---

## 🔧 **Troubleshooting**

### **Sync Fails**

**Error**: "Failed to sync pricing plans"

**Solutions:**
1. Check admin authentication
2. Verify database connection
3. Check console for detailed errors
4. Ensure Prisma schema is up-to-date

---

### **Plans Not Showing**

**Issue**: Plans synced but not visible

**Solutions:**
1. Check `isActive` flag (must be true)
2. Verify category matches filter
3. Refresh plans list
4. Check browser console for errors

---

### **Duplicate Plans**

**Issue**: Multiple plans with same name

**Solutions:**
1. Plans are matched by ID first
2. Then by name + category
3. Check for manual database edits
4. Use unique IDs in pricing.ts

---

## 🎯 **Future Enhancements**

### **Potential Features:**

1. **Automatic Sync**
   - Sync on app startup
   - Scheduled daily sync
   - Webhook-triggered sync

2. **Pricing History**
   - Track price changes over time
   - Show pricing timeline
   - Customer pricing snapshots

3. **A/B Testing**
   - Multiple pricing variants
   - Test different prices
   - Analytics on conversions

4. **Bulk Operations**
   - Sync specific plans only
   - Rollback to previous pricing
   - Preview changes before sync

---

## ✅ **Summary**

The dynamic pricing sync system provides:

✅ **Seamless Integration** - Landing page → Database → Admin  
✅ **One-Click Sync** - Update all plans instantly  
✅ **Safe Updates** - Preserves customer assignments  
✅ **Version Control** - Pricing changes tracked in Git  
✅ **Admin Control** - Full visibility and management  
✅ **Consistency** - Single source of truth  

**The pricing plans on your landing page are now dynamically connected to your admin dashboard!** 🎉

Admins can sync pricing updates with a single click, ensuring consistency across the entire platform.

