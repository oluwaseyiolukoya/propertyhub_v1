# Purchase Orders Database Integration Plan

## Current State Analysis

### Existing Database Tables
1. **`project_invoices`** - Tracks invoices for projects
   - Fields: id, projectId, vendorId, invoiceNumber, description, category, amount, currency, status, dueDate, paidDate, paymentMethod, approvedBy, approvedAt, attachments, notes
   - Status: pending, approved, paid, rejected

2. **`project_vendors`** - Vendor management
   - Fields: id, customerId, name, contactPerson, email, phone, address, vendorType, specialization, rating, totalContracts, totalValue, currency, status, notes
   - Vendor types: contractor, supplier, consultant, subcontractor

3. **`project_expenses`** - Expense tracking
   - Has expenseType field that includes: invoice, purchase_order, payroll, overhead, material, equipment, subcontractor

### Current Frontend Implementation
- **`PurchaseOrdersPage.tsx`** - Currently using mock data
- Features:
  - Purchase Orders list with status (Approved, Pending, Matched, Rejected)
  - Related invoices view
  - KPI cards (Total PO Value, Approved POs, Pending Approval, Total Invoiced)
  - Create PO and Invoice dialogs
  - Approval workflow tracking

## Database Schema Design

### Option 1: Create New `purchase_orders` Table (Recommended)
This provides proper separation of concerns and better data integrity.

```prisma
model purchase_orders {
  id              String             @id @default(uuid())
  projectId       String
  customerId      String
  vendorId        String?
  poNumber        String             @unique
  description     String
  category        String             // matches budget categories
  totalAmount     Float
  currency        String             @default("NGN")
  status          String             @default("pending") // draft, pending, approved, rejected, closed
  itemCount       Int                @default(0)
  requestedBy     String?            // user ID
  approvedBy      String?            // user ID
  approvedAt      DateTime?
  expiryDate      DateTime?
  deliveryDate    DateTime?
  terms           String?            // payment terms
  notes           String?
  attachments     Json?              // array of file URLs
  metadata        Json?
  createdAt       DateTime           @default(now())
  updatedAt       DateTime           @updatedAt
  
  project         developer_projects @relation(fields: [projectId], references: [id], onDelete: Cascade)
  customer        customers          @relation(fields: [customerId], references: [id], onDelete: Cascade)
  vendor          project_vendors?   @relation(fields: [vendorId], references: [id])
  requester       users?             @relation("PORequester", fields: [requestedBy], references: [id])
  approver        users?             @relation("POApprover", fields: [approvedBy], references: [id])
  
  // Relations
  invoices        project_invoices[]
  items           purchase_order_items[]
  
  @@index([projectId])
  @@index([customerId])
  @@index([vendorId])
  @@index([status])
  @@index([createdAt])
}

model purchase_order_items {
  id              String          @id @default(uuid())
  purchaseOrderId String
  description     String
  quantity        Float
  unitPrice       Float
  totalPrice      Float
  unit            String?         // e.g., "pcs", "kg", "m2"
  category        String?
  notes           String?
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt
  
  purchaseOrder   purchase_orders @relation(fields: [purchaseOrderId], references: [id], onDelete: Cascade)
  
  @@index([purchaseOrderId])
}
```

### Option 2: Extend Existing Tables
Use `project_invoices` for both POs and invoices with a type field.

**Pros of Option 1:**
- ✅ Clear separation of POs and invoices
- ✅ Better data modeling (PO → Invoice relationship)
- ✅ Easier to query and report
- ✅ More flexible for PO-specific fields
- ✅ Supports line items properly

**Cons of Option 1:**
- ❌ Requires database migration
- ❌ More tables to maintain

**Recommendation:** Use Option 1 for better long-term maintainability.

## Implementation Plan

### Phase 1: Database Schema
1. Create `purchase_orders` table
2. Create `purchase_order_items` table
3. Update `project_invoices` to add `purchaseOrderId` field
4. Run migration

### Phase 2: Backend API
Create endpoints for:
1. `GET /api/developer-dashboard/projects/:projectId/purchase-orders` - List POs
2. `POST /api/developer-dashboard/projects/:projectId/purchase-orders` - Create PO
3. `GET /api/developer-dashboard/purchase-orders/:poId` - Get PO details
4. `PATCH /api/developer-dashboard/purchase-orders/:poId` - Update PO
5. `DELETE /api/developer-dashboard/purchase-orders/:poId` - Delete PO
6. `POST /api/developer-dashboard/purchase-orders/:poId/approve` - Approve PO
7. `POST /api/developer-dashboard/purchase-orders/:poId/reject` - Reject PO
8. `GET /api/developer-dashboard/purchase-orders/:poId/invoices` - Get related invoices
9. `POST /api/developer-dashboard/purchase-orders/:poId/items` - Add line items
10. `GET /api/developer-dashboard/projects/:projectId/purchase-orders/stats` - Get KPIs

### Phase 3: Frontend Integration
1. Create API client functions
2. Replace mock data with real API calls
3. Implement create PO form with validation
4. Implement create invoice form linked to PO
5. Add line items management
6. Implement approval workflow
7. Add file upload for attachments
8. Implement filtering and search
9. Add export functionality

### Phase 4: Features
1. **Approval Workflow**
   - Multi-step approval process
   - Email notifications
   - Approval history tracking

2. **Budget Integration**
   - Link POs to budget line items
   - Check budget availability
   - Track commitments vs actuals

3. **Invoice Matching**
   - Match invoices to POs
   - Three-way matching (PO, Invoice, Receipt)
   - Variance tracking

4. **Reporting**
   - PO aging report
   - Vendor performance
   - Budget vs PO vs Invoice analysis

## Data Flow

### Purchase Order Creation
1. User creates PO with vendor, amount, items
2. System checks budget availability
3. PO saved with status "pending"
4. Notification sent to approver
5. Approver reviews and approves/rejects
6. If approved, PO status → "approved"
7. Vendor receives PO

### Invoice Creation & Matching
1. Invoice received from vendor
2. User creates invoice linked to PO
3. System compares invoice to PO
4. If amounts match → status "matched"
5. If variance → requires approval
6. Once approved → create expense
7. Mark as paid when payment processed

## Migration Strategy

### Step 1: Create Tables
```sql
-- Run Prisma migration
npx prisma migrate dev --name add_purchase_orders
```

### Step 2: Data Migration (if needed)
```sql
-- Migrate existing data if any POs stored elsewhere
-- This would be project-specific
```

### Step 3: Update Relations
```sql
-- Add purchaseOrderId to project_invoices
ALTER TABLE project_invoices ADD COLUMN purchase_order_id VARCHAR;
```

## API Response Formats

### Purchase Order List
```json
{
  "data": [
    {
      "id": "uuid",
      "poNumber": "PO-2025-001",
      "projectId": "uuid",
      "vendor": {
        "id": "uuid",
        "name": "ABC Construction",
        "contactPerson": "John Doe"
      },
      "totalAmount": 125000,
      "currency": "NGN",
      "status": "approved",
      "itemCount": 3,
      "category": "Foundation & Structure",
      "description": "Foundation materials",
      "createdAt": "2025-11-01T00:00:00Z",
      "approvedAt": "2025-11-02T10:30:00Z",
      "approvedBy": {
        "id": "uuid",
        "name": "Jane Manager"
      }
    }
  ],
  "stats": {
    "totalValue": 708500,
    "approvedCount": 3,
    "pendingCount": 2,
    "totalInvoiced": 164400
  }
}
```

### Invoice List with PO Reference
```json
{
  "data": [
    {
      "id": "uuid",
      "invoiceNumber": "INV-1234",
      "purchaseOrder": {
        "id": "uuid",
        "poNumber": "PO-2025-001"
      },
      "vendor": {
        "id": "uuid",
        "name": "ABC Construction"
      },
      "amount": 45000,
      "status": "approved",
      "dueDate": "2025-11-30",
      "attachments": [
        {
          "id": "uuid",
          "filename": "invoice_1234.pdf",
          "url": "https://..."
        }
      ],
      "approvalSteps": [
        {
          "step": "Budget Verification",
          "status": "completed",
          "completedBy": "John Davis",
          "completedAt": "2025-11-08T09:00:00Z"
        }
      ]
    }
  ]
}
```

## Security Considerations

1. **Authorization**
   - Only project members can view POs
   - Only authorized users can approve
   - Vendor-specific permissions

2. **Validation**
   - Budget availability checks
   - Duplicate PO number prevention
   - Amount validation

3. **Audit Trail**
   - Track all status changes
   - Log approvals/rejections
   - Maintain history

## Testing Checklist

- [ ] Create PO with valid data
- [ ] Create PO without budget availability
- [ ] Approve PO
- [ ] Reject PO
- [ ] Create invoice linked to PO
- [ ] Match invoice to PO
- [ ] Handle invoice/PO variance
- [ ] Filter POs by status
- [ ] Search POs by vendor/number
- [ ] Export PO data
- [ ] Upload attachments
- [ ] View approval workflow
- [ ] Test with multiple projects
- [ ] Test vendor selection
- [ ] Test budget line integration

## Next Steps

1. Review and approve this plan
2. Create database migration
3. Implement backend API endpoints
4. Update frontend to use real data
5. Test thoroughly
6. Deploy to production

## Timeline Estimate

- Database schema: 1-2 hours
- Backend API: 4-6 hours
- Frontend integration: 4-6 hours
- Testing & refinement: 2-3 hours
- **Total: 11-17 hours**

