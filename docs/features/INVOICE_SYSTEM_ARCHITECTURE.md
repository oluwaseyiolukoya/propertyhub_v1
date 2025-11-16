# Invoice Management System - Architecture Diagram

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    DEVELOPER DASHBOARD                          │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │  Portfolio   │  │   Projects   │  │  INVOICES    │  ...   │
│  │   Overview   │  │     Page     │  │     PAGE     │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      INVOICES PAGE                              │
├─────────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  KPI DASHBOARD                                            │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │ │
│  │  │  Total   │ │  Total   │ │   Paid   │ │ Pending  │   │ │
│  │  │ Invoices │ │  Amount  │ │  Amount  │ │ Payment  │   │ │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  FILTERS & SEARCH                                         │ │
│  │  [Search Box] [Status ▼] [Category ▼] [Export]          │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  INVOICES TABLE                                           │ │
│  │  ┌────────────────────────────────────────────────────┐  │ │
│  │  │ # │ Vendor │ Desc │ Category │ Amount │ Due │ ⋮ │  │ │
│  │  ├────────────────────────────────────────────────────┤  │ │
│  │  │ INV-001 │ BuildRight │ Steel │ Materials │ ₦125M │  │ │
│  │  │ INV-002 │ PowerTech  │ Elect │ Labor     │ ₦85M  │  │ │
│  │  │ INV-003 │ Concrete   │ Found │ Materials │ ₦42M  │  │ │
│  │  └────────────────────────────────────────────────────┘  │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  [+ New Invoice]                                               │
└─────────────────────────────────────────────────────────────────┘
        │                           │                      │
        │ Click Row                 │ Click Actions        │ Click New
        ▼                           ▼                      ▼
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│ INVOICE DETAIL   │    │ ACTIONS MENU     │    │ CREATE INVOICE   │
│     MODAL        │    │                  │    │      MODAL       │
├──────────────────┤    ├──────────────────┤    ├──────────────────┤
│ • Invoice #      │    │ • View Details   │    │ • Project        │
│ • Amount         │    │ • Approve        │    │ • Invoice #      │
│ • Status         │    │ • Reject         │    │ • Vendor         │
│ • Vendor Info    │    │ • Mark as Paid   │    │ • Description    │
│ • Description    │    │ • Delete         │    │ • Category       │
│ • Payment Info   │    └──────────────────┘    │ • Amount         │
│ • Timeline       │                            │ • Due Date       │
│ • Attachments    │                            │ • Notes          │
│                  │                            │ • Attachments    │
│ [Approve][Close] │                            │                  │
└──────────────────┘                            │ [Create][Cancel] │
                                                └──────────────────┘
```

## Component Architecture

```
src/modules/developer-dashboard/
│
├── components/
│   ├── DeveloperDashboard.tsx ──────┐
│   │                                 │
│   ├── InvoicesPage.tsx ◄───────────┤ Main Invoice Hub
│   │   │                            │
│   │   ├── KPICard.tsx              │ Reusable KPI cards
│   │   ├── Search & Filters         │ Filter controls
│   │   ├── Invoice Table            │ Data display
│   │   └── Action Handlers          │ Business logic
│   │                                 │
│   ├── CreateInvoiceModal.tsx ◄─────┤ Creation Dialog
│   │   ├── Form Fields              │
│   │   ├── Validation               │
│   │   └── Submit Handler           │
│   │                                 │
│   └── InvoiceDetailModal.tsx ◄─────┘ Detail View
│       ├── Header Section
│       ├── Vendor Info
│       ├── Payment Info
│       ├── Timeline
│       └── Action Buttons
│
├── types/
│   └── index.ts
│       ├── ProjectInvoice
│       ├── InvoiceStatus
│       ├── BudgetCategory
│       └── CreateInvoiceRequest
│
├── hooks/
│   └── useDeveloperDashboardData.ts
│       └── useDebounce()
│
└── services/
    └── developerDashboard.api.ts (Future)
        ├── getInvoices()
        ├── createInvoice()
        ├── approveInvoice()
        └── markAsPaid()
```

## Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER ACTIONS                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    REACT COMPONENTS                             │
│  • InvoicesPage                                                 │
│  • CreateInvoiceModal                                           │
│  • InvoiceDetailModal                                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      STATE MANAGEMENT                           │
│  • useState (local state)                                       │
│  • useDebounce (search optimization)                            │
│  • Modal visibility                                             │
│  • Filter states                                                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     API SERVICE LAYER                           │
│  • developerDashboard.api.ts                                    │
│  • HTTP requests                                                │
│  • Error handling                                               │
│  • Response transformation                                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND API                                │
│  • Express.js routes                                            │
│  • Authentication middleware                                    │
│  • Business logic                                               │
│  • Validation                                                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DATABASE LAYER                             │
│  • Prisma ORM                                                   │
│  • PostgreSQL                                                   │
│  • project_invoices table                                       │
│  • Relations (projects, vendors, users)                         │
└─────────────────────────────────────────────────────────────────┘
```

## Status Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                    INVOICE LIFECYCLE                            │
└─────────────────────────────────────────────────────────────────┘

    ┌─────────────┐
    │   CREATE    │
    │   INVOICE   │
    └──────┬──────┘
           │
           ▼
    ┌─────────────┐
    │   PENDING   │ ◄─── Initial Status
    │   APPROVAL  │      (Yellow Badge)
    └──────┬──────┘
           │
           ├─────────────────┐
           │                 │
           ▼                 ▼
    ┌─────────────┐   ┌─────────────┐
    │  APPROVED   │   │  REJECTED   │
    │             │   │             │
    │ (Blue)      │   │ (Red)       │
    └──────┬──────┘   └─────────────┘
           │                 │
           │                 ▼
           │          ┌─────────────┐
           │          │   END       │
           │          └─────────────┘
           │
           ▼
    ┌─────────────┐
    │    PAID     │
    │             │
    │ (Green)     │
    └──────┬──────┘
           │
           ▼
    ┌─────────────┐
    │   END       │
    └─────────────┘
```

## User Interaction Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER JOURNEY MAP                             │
└─────────────────────────────────────────────────────────────────┘

1. VIEW INVOICES
   ┌──────────┐
   │ Login    │
   └────┬─────┘
        │
        ▼
   ┌──────────┐
   │ Click    │
   │ Invoices │
   └────┬─────┘
        │
        ▼
   ┌──────────┐
   │ See List │
   │ + KPIs   │
   └──────────┘

2. CREATE INVOICE
   ┌──────────┐
   │ Click    │
   │ New      │
   └────┬─────┘
        │
        ▼
   ┌──────────┐
   │ Fill     │
   │ Form     │
   └────┬─────┘
        │
        ▼
   ┌──────────┐
   │ Submit   │
   └────┬─────┘
        │
        ▼
   ┌──────────┐
   │ Success  │
   │ Toast    │
   └──────────┘

3. APPROVE INVOICE
   ┌──────────┐
   │ Click    │
   │ Invoice  │
   └────┬─────┘
        │
        ▼
   ┌──────────┐
   │ Review   │
   │ Details  │
   └────┬─────┘
        │
        ▼
   ┌──────────┐
   │ Click    │
   │ Approve  │
   └────┬─────┘
        │
        ▼
   ┌──────────┐
   │ Status   │
   │ Updated  │
   └──────────┘

4. MARK AS PAID
   ┌──────────┐
   │ Find     │
   │ Approved │
   └────┬─────┘
        │
        ▼
   ┌──────────┐
   │ Click    │
   │ Mark Paid│
   └────┬─────┘
        │
        ▼
   ┌──────────┐
   │ Confirm  │
   └────┬─────┘
        │
        ▼
   ┌──────────┐
   │ Payment  │
   │ Recorded │
   └──────────┘
```

## Database Schema Relationships

```
┌─────────────────────────────────────────────────────────────────┐
│                    DATABASE RELATIONSHIPS                       │
└─────────────────────────────────────────────────────────────────┘

    ┌──────────────────┐
    │   customers      │
    │  (Organizations) │
    └────────┬─────────┘
             │
             │ 1:N
             │
    ┌────────▼─────────┐
    │ developer_       │
    │   projects       │
    └────────┬─────────┘
             │
             │ 1:N
             │
    ┌────────▼─────────┐         ┌──────────────┐
    │ project_         │ N:1     │ project_     │
    │   invoices       │◄────────┤   vendors    │
    └────────┬─────────┘         └──────────────┘
             │
             │ N:1
             │
    ┌────────▼─────────┐
    │     users        │
    │  (Approvers)     │
    └──────────────────┘

Key Fields:
• project_invoices
  - id (PK)
  - projectId (FK → developer_projects)
  - vendorId (FK → project_vendors)
  - approvedBy (FK → users)
  - invoiceNumber (UNIQUE)
  - amount, status, dates, etc.
```

## API Endpoint Structure (Future)

```
┌─────────────────────────────────────────────────────────────────┐
│                      API ENDPOINTS                              │
└─────────────────────────────────────────────────────────────────┘

/api/developer-dashboard/invoices
│
├── GET    /                  List all invoices
│   Query: ?status=pending&category=labor&page=1&limit=20
│
├── GET    /:id               Get single invoice
│
├── POST   /                  Create new invoice
│   Body: { projectId, invoiceNumber, amount, ... }
│
├── PUT    /:id               Update invoice
│   Body: { description, amount, ... }
│
├── DELETE /:id               Delete invoice
│
├── POST   /:id/approve       Approve invoice
│   Body: { notes }
│
├── POST   /:id/reject        Reject invoice
│   Body: { reason }
│
├── POST   /:id/mark-paid     Mark as paid
│   Body: { paidDate, paymentMethod }
│
└── GET    /export            Export invoices
    Query: ?format=pdf&status=paid
```

## Security Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    SECURITY LAYERS                              │
└─────────────────────────────────────────────────────────────────┘

    ┌──────────────────┐
    │  User Request    │
    └────────┬─────────┘
             │
             ▼
    ┌──────────────────┐
    │  Authentication  │ ◄─── JWT Token Validation
    │   Middleware     │      User Identity
    └────────┬─────────┘
             │
             ▼
    ┌──────────────────┐
    │  Authorization   │ ◄─── Role Checking
    │   Middleware     │      Permission Verification
    └────────┬─────────┘
             │
             ▼
    ┌──────────────────┐
    │  Input           │ ◄─── Data Sanitization
    │  Validation      │      Type Checking
    └────────┬─────────┘
             │
             ▼
    ┌──────────────────┐
    │  Business        │ ◄─── Ownership Verification
    │  Logic           │      Status Validation
    └────────┬─────────┘
             │
             ▼
    ┌──────────────────┐
    │  Database        │ ◄─── Parameterized Queries
    │  Operation       │      Transaction Safety
    └────────┬─────────┘
             │
             ▼
    ┌──────────────────┐
    │  Audit Log       │ ◄─── Action Recording
    │                  │      Timestamp
    └────────┬─────────┘
             │
             ▼
    ┌──────────────────┐
    │  Response        │
    └──────────────────┘
```

## Performance Optimization Strategy

```
┌─────────────────────────────────────────────────────────────────┐
│                  PERFORMANCE OPTIMIZATIONS                      │
└─────────────────────────────────────────────────────────────────┘

FRONTEND
├── Debounced Search (500ms)
├── Pagination (20 items/page)
├── Lazy Loading (modals)
├── Memoization (filtered results)
└── Code Splitting

BACKEND (Future)
├── Database Indexing
│   ├── projectId
│   ├── vendorId
│   ├── status
│   └── category
├── Query Optimization
├── Caching (Redis)
├── Connection Pooling
└── Compression

DATABASE
├── Indexed Columns
├── Foreign Keys
├── Efficient Queries
└── Pagination
```

---

**Architecture Type:** Modular Component-Based
**Pattern:** Container/Presentation
**State Management:** React Hooks
**Data Flow:** Unidirectional
**Status:** ✅ Frontend Complete, Backend Pending

