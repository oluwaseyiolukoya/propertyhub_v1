# 🔄 Bidirectional Pricing Sync - Complete Architecture

Expert-level implementation of a two-way pricing sync system between Landing Page and Admin Dashboard.

---

## 🏗️ **Architecture Overview**

### **The Problem:**
- Landing page pricing needs to be the source of truth (version controlled in Git)
- Admins need ability to customize plans in the dashboard
- Changes in either direction should be trackable and reversible
- Need to prevent data loss and maintain consistency

### **The Solution:**

```
┌─────────────────────────────────────────────────────────────┐
│                   BIDIRECTIONAL SYNC SYSTEM                  │
└─────────────────────────────────────────────────────────────┘

Landing Page (Code)          Database (Runtime)          Admin Dashboard
src/types/pricing.ts         plans table                 Billing & Plans
        │                         │                             │
        │   ┌──────────────────┐ │                             │
        │   │  Sync Service    │ │                             │
        ├───┤  - Compare       │─┤                             │
        │   │  - Detect Δ      │ │                             │
        │   │  - Merge         │ │                             │
        │   └──────────────────┘ │                             │
        │                         │                             │
        │◄────── Restore ─────────┤◄────── Restore Button ──────┤
        │                         │                             │
        │                         ├────── View Status ─────────►│
        │                         │      (Modified/In Sync)     │
        │                         │                             │
        │                         ├────── Edit Plan ───────────►│
        │                         │◄────── Save Changes ────────┤
        │                         │                             │
        │◄────── Export ──────────┤◄────── Export Button ───────┤
        │   (Copy to clipboard)   │                             │
```

---

## 🎯 **Key Features**

### **1. Modification Detection**

The system automatically detects when database plans differ from code:

```typescript
// Backend checks:
- Price changes
- Name changes
- Description changes
- Feature list changes
```

**Visual Indicators:**
- 🟡 **"Modified"** badge - Plan differs from landing page
- 🔵 **"Custom"** badge - Plan doesn't exist in code
- ✅ **No badge** - Plan matches landing page exactly

---

### **2. Three-Way Workflow**

#### **A. Landing Page → Database (Sync)**

**Use Case:** You updated pricing on the landing page

**Action:**
1. Edit `src/types/pricing.ts`
2. Click "Sync from Landing Page" in Admin
3. All plans update to match code

**Result:**
- New plans created
- Existing plans updated
- Modified badges disappear

---

#### **B. Database → Landing Page (Export)**

**Use Case:** You customized a plan in Admin and want to make it permanent

**Action:**
1. Edit plan in Admin Dashboard
2. Click "Export" button
3. Code copied to clipboard
4. Paste into `src/types/pricing.ts`
5. Commit to Git

**Result:**
- Plan becomes canonical
- Version controlled
- Team can review changes

---

#### **C. Database ← Landing Page (Restore)**

**Use Case:** You made changes in Admin but want to revert

**Action:**
1. Click "Restore" button on modified plan
2. Confirm restoration
3. Plan reverts to landing page version

**Result:**
- Custom changes discarded
- Plan matches code again
- Modified badge disappears

---

## 📊 **Status Indicators**

### **Plan States:**

| State | Badge | Meaning | Actions Available |
|-------|-------|---------|-------------------|
| **In Sync** | None | Matches landing page exactly | Edit, Export, Delete |
| **Modified** | 🟡 Modified | Changed in Admin | Edit, Export, Restore, Delete |
| **Custom** | 🔵 Custom | Doesn't exist in code | Edit, Export, Delete |

---

## 🔧 **Implementation Details**

### **Backend Services:**

#### **1. pricing-sync.service.ts**
```typescript
// Original sync service
- syncPricingPlansToDatabase()  // Code → DB
- getPricingPlans()              // Read from DB
- PROPERTY_OWNER_PLANS           // Source of truth
- PROPERTY_DEVELOPER_PLANS       // Source of truth
```

#### **2. pricing-management.service.ts** ✨ NEW
```typescript
// Advanced management
- getCanonicalPlan()             // Get code version
- isPlanModified()               // Compare DB vs Code
- getPlansWithStatus()           // Add modification flags
- restorePlanToCanonical()       // DB ← Code
- exportPlanToCode()             // DB → Code (TypeScript)
- getPlansComparison()           // Full diff report
```

---

### **API Endpoints:**

```http
POST /api/pricing-sync/sync
# Sync all plans from code to database

GET /api/pricing-sync/plans
# Get plans with modification status

POST /api/pricing-sync/restore/:planId
# Restore single plan to code version

GET /api/pricing-sync/export/:planId
# Export plan as TypeScript code

GET /api/pricing-sync/comparison
# Get detailed comparison report
```

---

### **Frontend Components:**

#### **Admin Dashboard Buttons:**

```tsx
// Sync Button (top right)
<Button onClick={handleSyncPricingPlans}>
  <RefreshCw /> Sync from Landing Page
</Button>

// Restore Button (per plan, if modified)
<Button onClick={() => handleRestorePlan(planId, planName)}>
  <RotateCcw /> Restore
</Button>

// Export Button (per plan)
<Button onClick={() => handleExportPlan(planId, planName)}>
  <Code /> Export
</Button>
```

---

## 🎯 **Use Cases & Workflows**

### **Use Case 1: Launch New Pricing**

**Scenario:** Marketing wants to launch new pricing tiers

**Workflow:**
1. **Update Code:**
   ```typescript
   // src/types/pricing.ts
   {
     id: 'professional',
     name: 'Professional',
     price: 39900, // Changed from 29900
     // ... rest of plan
   }
   ```

2. **Sync to Database:**
   - Admin → Billing & Plans → Plans Tab
   - Click "Sync from Landing Page"
   - Toast: "Successfully synced! 0 created, 1 updated"

3. **Verify:**
   - Professional plan now shows ₦39,900
   - No "Modified" badge
   - Existing customers keep old price
   - New customers see new price

---

### **Use Case 2: Test Custom Pricing**

**Scenario:** Want to test a special plan before committing to code

**Workflow:**
1. **Create in Admin:**
   - Click "Create Plan"
   - Fill in details
   - Save

2. **Test:**
   - Plan shows "Custom" badge
   - Assign to test customers
   - Monitor performance

3. **Make Permanent:**
   - Click "Export" button
   - Code copied to clipboard
   - Paste into `pricing.ts`
   - Commit to Git
   - Sync from landing page
   - "Custom" badge disappears

---

### **Use Case 3: Quick Price Adjustment**

**Scenario:** Need to temporarily adjust a price

**Workflow:**
1. **Edit in Admin:**
   - Click "Edit" on plan
   - Change price
   - Save

2. **Monitor:**
   - Plan shows "Modified" badge
   - Track results

3. **Decide:**
   - **Keep:** Export to code, commit
   - **Revert:** Click "Restore" button

---

### **Use Case 4: Emergency Rollback**

**Scenario:** New pricing causing issues, need to revert

**Workflow:**
1. **Identify Issue:**
   - Modified plans show yellow badge
   - Check which plans changed

2. **Restore:**
   - Click "Restore" on affected plans
   - Confirm restoration
   - Plans revert instantly

3. **Verify:**
   - "Modified" badges disappear
   - Pricing matches landing page
   - Issue resolved

---

## 🔍 **Modification Detection Logic**

### **Comparison Algorithm:**

```typescript
function isPlanModified(dbPlan, canonicalPlan) {
  // Compare critical fields
  if (dbPlan.monthlyPrice !== canonicalPlan.price) return true;
  if (dbPlan.name !== canonicalPlan.name) return true;
  if (dbPlan.description !== canonicalPlan.description) return true;
  
  // Compare features (deep comparison)
  const dbFeatures = JSON.stringify(dbPlan.features);
  const codeFeatures = JSON.stringify(
    canonicalPlan.features
      .filter(f => f.included)
      .map(f => f.text)
  );
  
  if (dbFeatures !== codeFeatures) return true;
  
  return false; // Plans match
}
```

---

## 📋 **Export Format**

### **Generated TypeScript Code:**

When you click "Export", you get:

```typescript
  {
    id: 'professional',
    name: 'Professional',
    description: 'For asset management, tenant mgmt...',
    price: 39900,
    currency: 'NGN',
    billingPeriod: 'month',
    userType: 'property-owner',
    popular: true,
    limits: {
      properties: 5,
      units: 200,
      users: 6,
      storage: '25GB',
    },
    features: [
      { text: '5 properties', included: true },
      { text: 'Up to 3 property managers', included: true },
      // ... more features
    ],
    cta: {
      text: 'Start Free Trial',
      action: 'signup',
    }
  },
```

**Ready to paste into `pricing.ts`!**

---

## ⚠️ **Safety Features**

### **1. Customer Protection**

✅ **Safe Operations:**
- Syncing from code
- Restoring to code version
- Exporting to code

❌ **What's Protected:**
- Customer assignments preserved
- Active subscriptions continue
- Billing history maintained
- No automatic price changes for existing customers

---

### **2. Confirmation Dialogs**

**Restore Action:**
```
⚠️ Restore "Professional" to landing page version?
   This will overwrite any custom changes.
   
   [Cancel] [Restore]
```

**Delete Action:**
```
⚠️ Cannot delete plan with active subscriptions
   
   Professional plan has 15 active customers.
   Please migrate customers first.
   
   [OK]
```

---

### **3. Audit Trail**

All changes are logged:
- Sync operations
- Restore operations
- Manual edits
- Timestamps
- Admin user

---

## 🎨 **UI/UX Design**

### **Visual Hierarchy:**

```
┌─────────────────────────────────────────────────────────┐
│ Professional  [active] [🟡 Modified]                    │
│ For asset management, tenant mgmt...                    │
│                                                         │
│ [Restore] [Export] [Edit] [Delete]                     │
└─────────────────────────────────────────────────────────┘
```

### **Color Coding:**

| Element | Color | Meaning |
|---------|-------|---------|
| Modified Badge | Yellow | Needs attention |
| Custom Badge | Blue | Informational |
| Active Badge | Green | Operational |
| Deprecated Badge | Gray | Historical |

---

## 📊 **Comparison Report**

### **GET /api/pricing-sync/comparison**

Returns detailed diff:

```json
{
  "inSync": [
    { "id": "starter", "name": "Starter" }
  ],
  "modified": [
    {
      "id": "professional",
      "name": "Professional",
      "database": {
        "price": 39900,
        "features": ["5 properties", ...]
      },
      "canonical": {
        "price": 29900,
        "features": ["5 properties", ...]
      }
    }
  ],
  "onlyInDatabase": [
    { "id": "custom-enterprise", "name": "Custom Enterprise" }
  ],
  "onlyInCode": [
    { "id": "new-plan", "name": "New Plan" }
  ]
}
```

---

## 🚀 **Best Practices**

### **1. Development Workflow**

```
1. Update pricing.ts (local)
2. Test on landing page
3. Commit to Git
4. Deploy
5. Sync in Admin Dashboard
6. Verify all plans updated
```

---

### **2. Production Changes**

```
1. Edit plan in Admin (testing)
2. Monitor for 24-48 hours
3. If successful:
   - Export to code
   - Create PR
   - Code review
   - Merge
   - Sync again (now canonical)
4. If unsuccessful:
   - Click Restore
   - Plan reverts instantly
```

---

### **3. Team Collaboration**

```
Marketing: Updates pricing.ts
           ↓
Git PR:    Team reviews changes
           ↓
Deploy:    Auto-deploy to production
           ↓
Admin:     Clicks "Sync from Landing Page"
           ↓
Verify:    All plans match code
```

---

## 🧪 **Testing Checklist**

### **Sync Testing:**

- [ ] Sync creates new plans
- [ ] Sync updates existing plans
- [ ] Sync preserves customer assignments
- [ ] Modified badges appear/disappear correctly
- [ ] Prices update correctly
- [ ] Features update correctly

### **Restore Testing:**

- [ ] Restore reverts to code version
- [ ] Modified badge disappears
- [ ] Customer assignments preserved
- [ ] Confirmation dialog appears

### **Export Testing:**

- [ ] Export generates valid TypeScript
- [ ] Code copies to clipboard
- [ ] Pasted code works in pricing.ts
- [ ] Re-sync removes Modified badge

---

## 🎊 **Summary**

The bidirectional pricing sync system provides:

✅ **Single Source of Truth** - Code is canonical  
✅ **Admin Flexibility** - Test changes quickly  
✅ **Version Control** - All changes tracked in Git  
✅ **Easy Rollback** - One-click restore  
✅ **Export Capability** - Make temp changes permanent  
✅ **Modification Detection** - Always know what's changed  
✅ **Customer Safety** - No disruption to subscriptions  
✅ **Team Collaboration** - Clear workflow for everyone  

**You now have a production-grade, bidirectional pricing management system!** 🚀

Admins can customize plans while maintaining code as the source of truth, with full visibility into modifications and easy restoration capabilities.

