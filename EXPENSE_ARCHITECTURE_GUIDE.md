# Expense Management Architecture Guide

## 📊 Complete Field List & Update Locations

This document provides a comprehensive overview of the expense management system architecture and all fields that need to be updated when making changes to the expense model.

---

## 🗄️ Database Schema (Prisma)

**Location:** `/backend/prisma/schema.prisma`

### **Expense Model Fields:**

```prisma
model expenses {
  // Core Identification
  id              String     @id                    // UUID
  propertyId      String                            // Required
  unitId          String?                           // Optional
  
  // Expense Details
  category        String                            // Required (from EXPENSE_CATEGORIES)
  description     String                            // Required
  amount          Float                             // Required
  currency        String     @default("NGN")        // Property currency
  
  // Date Management
  date            DateTime   @default(now())        // Expense date
  dueDate         DateTime?                         // Optional due date
  createdAt       DateTime   @default(now())        // Auto-generated
  updatedAt       DateTime   @updatedAt             // Auto-updated
  
  // Payment Tracking
  status          String     @default("pending")    // pending|paid|overdue|cancelled
  paidDate        DateTime?                         // When paid
  paymentMethod   String?                           // Optional (from PAYMENT_METHODS)
  receipt         String?                           // Receipt file path/URL
  
  // User & Authorization
  recordedBy      String                            // User ID who created
  recordedByRole  String                            // owner|manager
  requiresApproval Boolean   @default(false)        // true if created by manager
  approvedBy      String?                           // Owner ID who approved
  approvedAt      DateTime?                         // Approval timestamp
  visibleToManager Boolean   @default(false)        // Visibility control
  
  // Additional Info
  notes           String?                           // Optional notes
  
  // Relations
  property        properties @relation(fields: [propertyId], references: [id], onDelete: Cascade)
  unit            units?     @relation(fields: [unitId], references: [id], onDelete: SetNull)
  recorder        users      @relation("RecordedExpenses", fields: [recordedBy], references: [id])
  approver        users?     @relation("ApprovedExpenses", fields: [approvedBy], references: [id])
  
  // Indexes for Performance
  @@index([propertyId])
  @@index([date])
  @@index([category])
  @@index([status])
  @@index([visibleToManager])
}
```

---

## 🔧 Backend API (Express + Prisma)

**Location:** `/backend/src/routes/expenses.ts`

### **API Endpoints:**

#### 1. **GET `/api/expenses/stats/overview`**
Returns aggregated expense statistics.

**Response Fields:**
```typescript
{
  totalAmount: number,
  totalCount: number,
  byCategory: Array<{
    category: string,
    _sum: { amount: number | null },
    _count: number
  }>,
  byStatus: Array<{
    status: string,
    _sum: { amount: number | null },
    _count: number
  }>,
  byProperty: Array<{      // Owner only
    propertyId: string,
    propertyName: string,
    currency: string,
    totalAmount: number,
    count: number
  }>
}
```

#### 2. **GET `/api/expenses`**
Returns list of expenses with filtering.

**Query Parameters:**
- `propertyId?: string`
- `category?: string`
- `status?: string`
- `startDate?: string`
- `endDate?: string`

**Response Fields:** Array of full Expense objects (see Frontend Interface)

#### 3. **GET `/api/expenses/:id`**
Returns single expense details.

**Response Fields:** Full Expense object with relations

#### 4. **POST `/api/expenses`**
Creates new expense.

**Request Body:**
```typescript
{
  propertyId: string,           // Required
  unitId?: string,              // Optional
  category: string,             // Required
  description: string,          // Required
  amount: number,               // Required
  currency?: string,            // Optional (defaults to property currency)
  date?: string,                // Optional (defaults to now)
  dueDate?: string,             // Optional
  status?: string,              // Optional (defaults to 'pending')
  paymentMethod?: string,       // Optional
  receipt?: string,             // Optional
  notes?: string,               // Optional
  visibleToManager?: boolean    // Optional (defaults to false)
}
```

**Auto-Generated Fields:**
- `id` - UUID
- `recordedBy` - From auth token
- `recordedByRole` - From auth token
- `requiresApproval` - true if manager, false if owner
- `createdAt` - Current timestamp
- `updatedAt` - Current timestamp

#### 5. **PUT `/api/expenses/:id`**
Updates existing expense.

**Request Body:** (All optional)
```typescript
{
  category?: string,
  description?: string,
  amount?: number,
  currency?: string,
  date?: string,
  dueDate?: string,
  status?: string,
  paidDate?: string,
  paymentMethod?: string,
  receipt?: string,
  notes?: string,
  visibleToManager?: boolean
}
```

**Auto-Updated Fields:**
- `updatedAt` - Current timestamp

#### 6. **DELETE `/api/expenses/:id`**
Deletes expense (owner only).

#### 7. **POST `/api/expenses/:id/approve`**
Approves manager expense (owner only).

**Auto-Updated Fields:**
- `approvedBy` - Owner ID
- `approvedAt` - Current timestamp
- `updatedAt` - Current timestamp

---

## 💻 Frontend API Client

**Location:** `/src/lib/api/expenses.ts`

### **TypeScript Interfaces:**

#### 1. **Expense Interface**
```typescript
export interface Expense {
  // Core Fields
  id: string;
  propertyId: string;
  unitId?: string | null;
  category: string;
  description: string;
  amount: number;
  currency: string;
  
  // Dates
  date: string;
  dueDate?: string | null;
  createdAt: string;
  updatedAt: string;
  
  // Payment
  status: string;
  paidDate?: string | null;
  paymentMethod?: string | null;
  receipt?: string | null;
  
  // Authorization
  recordedBy: string;
  recordedByRole: string;
  requiresApproval: boolean;
  approvedBy?: string | null;
  approvedAt?: string | null;
  visibleToManager: boolean;
  
  // Additional
  notes?: string | null;
  
  // Relations (populated)
  property?: {
    id: string;
    name: string;
    currency?: string;
  };
  unit?: {
    id: string;
    unitNumber: string;
  } | null;
  recorder?: {
    id: string;
    name: string;
    email: string;
  };
  approver?: {
    id: string;
    name: string;
    email: string;
  } | null;
}
```

#### 2. **CreateExpenseData Interface**
```typescript
export interface CreateExpenseData {
  propertyId: string;
  unitId?: string;
  category: string;
  description: string;
  amount: number;
  currency?: string;
  date?: string;
  dueDate?: string;
  status?: string;
  paymentMethod?: string;
  receipt?: string;
  notes?: string;
  visibleToManager?: boolean;
}
```

#### 3. **UpdateExpenseData Interface**
```typescript
export interface UpdateExpenseData {
  category?: string;
  description?: string;
  amount?: number;
  currency?: string;
  date?: string;
  dueDate?: string;
  status?: string;
  paidDate?: string;
  paymentMethod?: string;
  receipt?: string;
  notes?: string;
  visibleToManager?: boolean;
}
```

#### 4. **ExpenseStats Interface**
```typescript
export interface ExpenseStats {
  totalAmount: number;
  totalCount: number;
  byCategory: Array<{
    category: string;
    _sum: { amount: number | null };
    _count: number;
  }>;
  byStatus: Array<{
    status: string;
    _sum: { amount: number | null };
    _count: number;
  }>;
  byProperty?: Array<{
    propertyId: string;
    propertyName: string;
    currency: string;
    totalAmount: number;
    count: number;
  }>;
}
```

### **API Functions:**
```typescript
getExpenses(params?)          // List expenses
getExpense(id)                // Get single expense
createExpense(data)           // Create expense
updateExpense(id, data)       // Update expense
deleteExpense(id)             // Delete expense
getExpenseStats(params?)      // Get statistics
approveExpense(id)            // Approve expense
```

---

## 🎨 UI Components

### **1. ExpenseManagement Component**
**Location:** `/src/components/ExpenseManagement.tsx`

**State Fields:**
```typescript
// Form State
const [expenseForm, setExpenseForm] = useState({
  propertyId: '',
  unitId: 'none',
  category: '',
  description: '',
  amount: '',
  currency: '',
  date: new Date().toISOString().split('T')[0],
  dueDate: '',
  status: 'pending',
  paymentMethod: '',
  notes: '',
  visibleToManager: false
});
```

**Form Fields in Dialog:**
1. **Property** - Select (required)
2. **Unit** - Select (optional, filtered by property)
3. **Category** - Select (required, from EXPENSE_CATEGORIES)
4. **Description** - Textarea (required)
5. **Amount** - Input number (required)
6. **Currency** - Auto-filled from property
7. **Date** - Input date (defaults to today)
8. **Due Date** - Input date (optional)
9. **Status** - Select (from EXPENSE_STATUSES)
10. **Payment Method** - Select (from PAYMENT_METHODS)
11. **Notes** - Textarea (optional)

**Display Fields in Table:**
1. Date
2. Property Name
3. Unit Number (if applicable)
4. Category
5. Description
6. Amount (with currency)
7. Status (badge)
8. Actions (dropdown menu)

**Actions Available:**
- Edit Expense
- Approve (if requiresApproval and user is owner)
- Show/Hide from Managers (if owner-created and user is owner)
- Delete (owner only)

---

### **2. PropertiesPage Component**
**Location:** `/src/components/PropertiesPage.tsx`

**Note:** This component has expense management embedded but should be removed as ExpenseManagement is now a separate module.

**Fields Used:** Same as ExpenseManagement

---

### **3. PropertyOwnerDashboard**
**Location:** `/src/components/PropertyOwnerDashboard.tsx`

**Integration:**
- Renders `<ExpenseManagement />` when `currentView === 'expenses'`
- Passes `user`, `properties`, `units` as props

---

### **4. PropertyManagerDashboard**
**Location:** `/src/components/PropertyManagerDashboard.tsx`

**Integration:**
- Renders `<ExpenseManagement />` when `activeTab === 'expenses'`
- Passes `user`, `properties`, `units` as props
- Manager sees filtered expenses (own + visible owner expenses)

---

## 📋 Predefined Values

### **EXPENSE_CATEGORIES**
```typescript
[
  { value: 'maintenance', label: 'Maintenance & Repairs' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'property_tax', label: 'Property Tax' },
  { value: 'management_fee', label: 'Management Fee' },
  { value: 'leasing_fee', label: 'Leasing Fee' },
  { value: 'cleaning', label: 'Cleaning' },
  { value: 'landscaping', label: 'Landscaping' },
  { value: 'security', label: 'Security' },
  { value: 'waste_management', label: 'Waste Management' },
  { value: 'legal', label: 'Legal Fees' },
  { value: 'accounting', label: 'Accounting' },
  { value: 'advertising', label: 'Advertising & Marketing' },
  { value: 'other', label: 'Other' }
]
```

### **EXPENSE_STATUSES**
```typescript
[
  { value: 'pending', label: 'Pending', color: 'yellow' },
  { value: 'paid', label: 'Paid', color: 'green' },
  { value: 'overdue', label: 'Overdue', color: 'red' },
  { value: 'cancelled', label: 'Cancelled', color: 'gray' }
]
```

### **PAYMENT_METHODS**
```typescript
[
  { value: 'cash', label: 'Cash' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'check', label: 'Check' },
  { value: 'card', label: 'Card' },
  { value: 'mobile_money', label: 'Mobile Money' },
  { value: 'other', label: 'Other' }
]
```

---

## 🔄 Data Flow

### **Creating an Expense:**
```
1. User fills form in ExpenseManagement
   ↓
2. handleSaveExpense() calls createExpense()
   ↓
3. POST /api/expenses
   ↓
4. Backend validates & creates in DB
   ↓
5. Auto-sets: id, recordedBy, recordedByRole, requiresApproval, createdAt, updatedAt
   ↓
6. Returns created expense
   ↓
7. Frontend reloads expenses & stats
   ↓
8. Toast notification shown
```

### **Updating an Expense:**
```
1. User clicks Edit in dropdown
   ↓
2. Form pre-populated with expense data
   ↓
3. User modifies fields
   ↓
4. handleSaveExpense() calls updateExpense()
   ↓
5. PUT /api/expenses/:id
   ↓
6. Backend validates & updates in DB
   ↓
7. Auto-updates: updatedAt
   ↓
8. Returns updated expense
   ↓
9. Frontend reloads expenses & stats
   ↓
10. Toast notification shown
```

### **Visibility Control:**
```
1. Owner clicks "Show/Hide from Managers"
   ↓
2. handleToggleVisibility() calls updateExpense()
   ↓
3. PUT /api/expenses/:id with { visibleToManager: !current }
   ↓
4. Backend updates visibleToManager field
   ↓
5. Manager queries filtered by:
   - recordedBy = managerId OR
   - visibleToManager = true
   ↓
6. Manager sees/doesn't see expense accordingly
```

---

## 🔐 Authorization Rules

### **Field-Level Permissions:**

| Field | Owner Can Edit | Manager Can Edit | Notes |
|-------|---------------|------------------|-------|
| propertyId | ✅ | ❌ | Only on create |
| unitId | ✅ | ✅ | |
| category | ✅ | ✅ | |
| description | ✅ | ✅ | |
| amount | ✅ | ✅ | |
| currency | ✅ | ❌ | Auto from property |
| date | ✅ | ✅ | |
| dueDate | ✅ | ✅ | |
| status | ✅ | ✅ | |
| paidDate | ✅ | ✅ | |
| paymentMethod | ✅ | ✅ | |
| receipt | ✅ | ✅ | |
| notes | ✅ | ✅ | |
| visibleToManager | ✅ | ❌ | Owner only |
| recordedBy | ❌ | ❌ | Auto-set |
| recordedByRole | ❌ | ❌ | Auto-set |
| requiresApproval | ❌ | ❌ | Auto-set |
| approvedBy | ❌ | ❌ | Via approve endpoint |
| approvedAt | ❌ | ❌ | Via approve endpoint |

### **Action Permissions:**

| Action | Owner | Manager | Notes |
|--------|-------|---------|-------|
| Create Expense | ✅ | ✅ | |
| View Own Expense | ✅ | ✅ | |
| View Other's Expense | ✅ | ⚠️ | Only if visibleToManager=true |
| Edit Own Expense | ✅ | ✅ | |
| Edit Other's Expense | ✅ | ❌ | |
| Delete Expense | ✅ | ❌ | Owner only |
| Approve Expense | ✅ | ❌ | Owner only |
| Toggle Visibility | ✅ | ❌ | Owner only, own expenses |

---

## 📊 Statistics & Aggregations

### **Expense Stats Calculations:**

1. **Total Amount:** Sum of all expense amounts
2. **Total Count:** Count of all expenses
3. **By Category:** Group by category, sum amounts, count
4. **By Status:** Group by status, sum amounts, count
5. **By Property:** (Owner only) Group by property, sum amounts, count

### **Filtering Logic:**

**For Owners:**
```typescript
WHERE propertyId IN (owner's properties)
```

**For Managers:**
```typescript
WHERE propertyId IN (assigned properties)
  AND (
    recordedBy = managerId OR
    visibleToManager = true
  )
```

---

## 🎯 When to Update Each Location

### **Adding a New Field:**

1. ✅ **Database Schema** (`schema.prisma`)
   - Add field to `expenses` model
   - Run `npx prisma db push` or create migration

2. ✅ **Backend API** (`routes/expenses.ts`)
   - Add to CREATE endpoint request body
   - Add to UPDATE endpoint request body
   - Add to response includes if relation

3. ✅ **Frontend Interface** (`lib/api/expenses.ts`)
   - Add to `Expense` interface
   - Add to `CreateExpenseData` interface (if createable)
   - Add to `UpdateExpenseData` interface (if updateable)

4. ✅ **Frontend Form** (`ExpenseManagement.tsx`)
   - Add to `expenseForm` state
   - Add to `handleAddExpense` reset
   - Add to `handleEditExpense` population
   - Add to `handleSaveExpense` payload
   - Add form field in Dialog

5. ✅ **Frontend Display** (`ExpenseManagement.tsx`)
   - Add to table columns (if displayed)
   - Add to detail view (if shown)

---

## 🔍 Search & Filter Fields

**Current Filterable Fields:**
- `propertyId` - Filter by property
- `category` - Filter by category
- `status` - Filter by status
- `startDate` - Filter by date range (start)
- `endDate` - Filter by date range (end)
- `description` - Search in description (frontend)

**Current Sortable Fields:**
- `date` - Sort by expense date
- `amount` - Sort by amount

---

## 💾 Database Indexes

**Indexed Fields for Performance:**
```prisma
@@index([propertyId])      // Property filtering
@@index([date])            // Date sorting/filtering
@@index([category])        // Category filtering
@@index([status])          // Status filtering
@@index([visibleToManager])// Visibility filtering
```

---

## 🚨 Important Notes

### **Field Defaults:**
- `currency` → Property's currency
- `date` → Current date
- `status` → 'pending'
- `visibleToManager` → false (hidden from managers)
- `requiresApproval` → true if manager, false if owner

### **Auto-Generated Fields:**
- `id` → UUID
- `recordedBy` → From auth token
- `recordedByRole` → From auth token
- `createdAt` → Current timestamp
- `updatedAt` → Auto-updated on changes

### **Cascading Deletes:**
- Delete Property → Deletes all expenses (`onDelete: Cascade`)
- Delete Unit → Sets `unitId` to null (`onDelete: SetNull`)
- Delete User → Blocked if they have recorded expenses

### **Validation Rules:**
- `amount` must be > 0
- `propertyId` must exist and user must have access
- `unitId` must belong to selected property (if provided)
- `category` must be from EXPENSE_CATEGORIES
- `status` must be from EXPENSE_STATUSES
- `paymentMethod` must be from PAYMENT_METHODS (if provided)

---

## 📝 Summary Checklist

When modifying expense fields, update:

- [ ] Database schema (`schema.prisma`)
- [ ] Backend API routes (`routes/expenses.ts`)
- [ ] Frontend TypeScript interfaces (`lib/api/expenses.ts`)
- [ ] Frontend form state (`ExpenseManagement.tsx`)
- [ ] Frontend form fields (Dialog in `ExpenseManagement.tsx`)
- [ ] Frontend display (Table in `ExpenseManagement.tsx`)
- [ ] Authorization checks (if permission-based)
- [ ] Validation rules (backend & frontend)
- [ ] Documentation (this file)

---

*Last Updated: October 27, 2025*
*Architecture Status: ✅ Complete & Documented*

