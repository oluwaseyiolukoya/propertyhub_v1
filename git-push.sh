#!/bin/bash

# Git Push Script
# This script will stage, commit, and push all changes

echo "📦 Starting git operations..."
echo ""

# Change to the workspace directory
cd /Users/oluwaseyio/.cursor/worktrees/test_ui_figma_and_cursor/aHd5Z

# Check git status
echo "📋 Current git status:"
git status
echo ""

# Stage all changes
echo "➕ Staging all changes..."
git add -A
echo "✅ Changes staged"
echo ""

# Commit with detailed message
echo "💾 Committing changes..."
git commit -m "feat: Complete Purchase Orders & Invoices implementation

- Added vendor management (CRUD operations)
- Implemented Purchase Order creation, editing, and approval workflow
- Added invoice creation linked to POs
- Implemented 'Mark Invoice as Paid' with automatic expense creation
- Fixed invoice status updates and UI feedback
- Added complete invoice details display (due date, payment method, notes)
- Enhanced PO details panel with line items and additional info
- Updated invoice details dialog to show all entered fields
- Added status badges for paid invoices (emerald green)
- Improved UX with instant status updates and conditional rendering

Key Features:
✅ Vendor Management - Create, edit, delete vendors
✅ Purchase Orders - Full CRUD with line items
✅ Invoice Management - Link to POs, mark as paid
✅ Automatic Expense Creation - When invoice marked as paid
✅ Complete Data Display - All fields visible in details
✅ Status Tracking - Visual badges for invoice status
✅ Conditional UI - Mark as Paid disappears after payment

Files Modified:
- src/modules/developer-dashboard/components/PurchaseOrdersPage.tsx
- src/lib/api/purchase-orders.ts
- src/lib/api/vendors.ts
- src/lib/api/invoices.ts
- backend/src/routes/purchase-orders.ts
- backend/src/routes/vendors.ts
- backend/src/routes/developer-dashboard.ts
- backend/src/index.ts
- backend/prisma/schema.prisma

Documentation Added:
- PO_INVOICE_EXPENSE_WORKFLOW.md
- MARK_INVOICE_AS_PAID_IMPLEMENTATION_COMPLETE.md
- INVOICE_STATUS_UPDATE_FIX.md
- INVOICE_DETAILS_COMPLETE_FIX.md
- PO_EDIT_DATA_PERSISTENCE_FIX.md
- PO_LINE_ITEMS_DISPLAY_FIX.md
- PO_UPDATE_IMPLEMENTATION.md
- INVOICE_VENDOR_NAME_FIX.md"

echo "✅ Changes committed"
echo ""

# Push to remote
echo "🚀 Pushing to remote repository..."
git push origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Successfully pushed to remote!"
    echo ""
else
    echo ""
    echo "❌ Push failed. You may need to pull first or resolve conflicts."
    echo "Try running: git pull origin main --rebase"
    echo ""
fi

echo "✅ Git operations complete!"

