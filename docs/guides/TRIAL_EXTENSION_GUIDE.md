# 🎯 How to Extend Trial Period for Existing Customers

## ✅ Feature Added: Manual Trial Date Management

You can now manually edit trial start and end dates for customers in trial status via the Admin Dashboard.

---

## 📍 Where to Find It

### Step 1: Login as Admin

1. Go to your application
2. Login with admin credentials

### Step 2: Navigate to Customer Management

1. Click on **"Customer Management"** tab in the admin dashboard
2. Find the customer you want to extend (e.g., `demo@contrezz.com`)

### Step 3: Edit Customer

1. Click the **"Edit"** button (pencil icon) next to the customer
2. The edit dialog will open

### Step 4: Locate Trial Period Section

**Important:** The "Trial Period" section only appears if the customer's status is **"Trial"**

If you see:
- ✅ Status dropdown set to "Trial" → Trial Period section will be visible
- ❌ Status set to "Active", "Suspended", or "Cancelled" → No trial section

The Trial Period section appears as a **blue box** below the "Status" and "Billing Cycle" fields.

---

## 🎨 What You'll See

When editing a customer with **Status = Trial**, you'll see:

```
┌─────────────────────────────────────────────────┐
│ 🕐 Trial Period                                 │
├─────────────────────────────────────────────────┤
│                                                 │
│  Trial Start Date          Trial End Date      │
│  [2025-11-08]             [2025-11-22]         │
│  When the trial period    When the trial       │
│  started                  period expires        │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │ Trial Duration: 14 days                   │ │
│  │ Days Remaining: 13 days                   │ │
│  └───────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

---

## 🔧 How to Extend Trial

### Example: Extend `demo@contrezz.com` to 30 Days

#### Current Situation:
- Trial Start: 2025-11-08
- Trial End: 2025-11-22
- Duration: 14 days
- Days Left: 13 days

#### To Extend to 30 Days from Today:

1. **Click Edit** on `demo@contrezz.com`

2. **Find the "Trial Period" section** (blue box)

3. **Update "Trial End Date"**:
   - Current: `2025-11-22`
   - New: `2025-12-09` (30 days from Nov 9)

4. **Verify the calculation**:
   - The white box below will automatically show:
     - Trial Duration: 31 days (Nov 8 to Dec 9)
     - Days Remaining: 30 days (Nov 9 to Dec 9)

5. **Click "Save Changes"**

6. **Done!** The customer will now see "30 Days Left in Trial"

---

## 📊 Common Scenarios

### Scenario 1: Give Customer a Fresh 30-Day Trial

**Goal:** Reset trial to 30 days from today

**Steps:**
1. Edit customer
2. Set **Trial Start Date** = Today (e.g., `2025-11-09`)
3. Set **Trial End Date** = 30 days from today (e.g., `2025-12-09`)
4. Save

**Result:** Customer sees "30 Days Left in Trial"

---

### Scenario 2: Extend Current Trial by 7 Days

**Goal:** Add 7 more days to existing trial

**Current:**
- Trial End: `2025-11-22`

**Steps:**
1. Edit customer
2. Keep **Trial Start Date** as is
3. Change **Trial End Date** to `2025-11-29` (7 days later)
4. Save

**Result:** Customer gets 7 extra days

---

### Scenario 3: Shorten Trial (Urgent Upgrade Needed)

**Goal:** Trial expires in 3 days instead of 13

**Current:**
- Trial End: `2025-11-22`

**Steps:**
1. Edit customer
2. Keep **Trial Start Date** as is
3. Change **Trial End Date** to `2025-11-12` (3 days from now)
4. Save

**Result:** Customer sees "3 Days Left in Trial"

---

## 🎯 Quick Reference: Date Calculator

To extend `demo@contrezz.com` to 30 days from **November 9, 2025**:

| Trial Duration | Trial Start Date | Trial End Date |
|----------------|------------------|----------------|
| 30 days        | 2025-11-08       | **2025-12-08** |
| 30 days (fresh)| 2025-11-09       | **2025-12-09** |
| 60 days        | 2025-11-08       | **2026-01-07** |
| 90 days        | 2025-11-08       | **2026-02-06** |

---

## ⚠️ Important Notes

### 1. Status Must Be "Trial"

The trial date fields **only appear** when Status = "Trial"

If you change status to "Active", "Suspended", or "Cancelled", the trial fields will disappear.

### 2. Dates Are Saved Immediately

Once you click "Save Changes", the new trial dates are:
- ✅ Saved to the database
- ✅ Reflected in the customer's dashboard immediately
- ✅ Used for trial countdown and expiration

### 3. Automatic Calculation

The system automatically calculates:
- **Trial Duration:** Total days from start to end
- **Days Remaining:** Days from today to end date

This helps you verify the dates are correct before saving.

### 4. Real-Time Updates

After saving:
- Customer's dashboard will show the new countdown
- Trial banner will reflect the updated days remaining
- No need to refresh or re-login

---

## 🧪 Testing the Feature

### Test 1: Verify UI Appears

1. **Login as admin**
2. **Go to Customer Management**
3. **Click Edit** on a trial customer
4. **Verify:** Blue "Trial Period" section is visible
5. **Verify:** Two date input fields are present
6. **Verify:** Calculation box shows duration and days remaining

### Test 2: Extend Trial to 30 Days

1. **Edit** `demo@contrezz.com`
2. **Change Trial End Date** to `2025-12-09`
3. **Verify calculation** shows ~30 days remaining
4. **Click "Save Changes"**
5. **Success message** appears
6. **Close dialog**

### Test 3: Verify Customer Sees Update

1. **Logout from admin**
2. **Login as** `demo@contrezz.com` (password: `demo123`)
3. **Check dashboard**
4. **Verify:** Trial banner shows "30 Days Left in Trial"
5. **Verify:** Trial countdown in header shows "30"

---

## 🔍 Troubleshooting

### Problem: Trial Period Section Not Showing

**Cause:** Customer status is not "Trial"

**Solution:**
1. Check the "Status" dropdown in the edit form
2. Ensure it's set to "Trial"
3. The trial section will appear below

---

### Problem: Dates Don't Save

**Cause:** Backend not running or database connection issue

**Solution:**
1. Check backend is running: `cd backend && npm run dev`
2. Check database connection in `backend/.env.local`
3. Check browser console for errors

---

### Problem: Customer Still Sees Old Days

**Cause:** Frontend cache or not refreshed

**Solution:**
1. **Hard refresh** customer dashboard (Cmd+Shift+R or Ctrl+Shift+R)
2. **Logout and login again** as the customer
3. **Check database** to verify dates were saved:

```bash
cd backend
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

prisma.customers.findFirst({
  where: { email: 'demo@contrezz.com' },
  select: { email: true, trialStartsAt: true, trialEndsAt: true }
}).then(customer => {
  console.log('Customer:', customer.email);
  console.log('Trial Start:', customer.trialStartsAt);
  console.log('Trial End:', customer.trialEndsAt);
  
  const days = Math.ceil(
    (new Date(customer.trialEndsAt) - new Date()) / (1000 * 60 * 60 * 24)
  );
  console.log('Days Remaining:', days);
  
  prisma.\$disconnect();
});
"
```

---

## 📝 Summary

### ✅ What Was Added

1. **Trial Start Date** input field (date picker)
2. **Trial End Date** input field (date picker)
3. **Automatic calculation** of duration and days remaining
4. **Visual feedback** with blue-themed trial section
5. **Backend support** for saving custom trial dates

### ✅ How It Works

- Admin can manually set trial start and end dates
- System calculates and displays duration in real-time
- Changes save to database immediately
- Customer sees updated trial countdown instantly

### ✅ When to Use

- **Extend trials** for valuable customers
- **Shorten trials** to encourage upgrades
- **Reset trials** for returning customers
- **Fix incorrect** trial dates

---

## 🎉 Next Steps

1. **Login as admin**
2. **Navigate to Customer Management**
3. **Edit** `demo@contrezz.com`
4. **Find the blue "Trial Period" section**
5. **Change Trial End Date** to `2025-12-09`
6. **Save**
7. **Login as customer** to verify

**The trial extension feature is now live and ready to use!** 🚀

