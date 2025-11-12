# Purchase Orders & Invoices - Quick Reference Guide

## 🚀 Quick Start

### Access the Page
1. Login as Property Developer
2. Select a project from Portfolio Overview
3. Click "Purchase Orders" in the project sub-menu

## 📊 Key Features

### KPI Metrics
- **Total PO Value**: Sum of all purchase orders
- **Approved POs**: Count of approved purchase orders
- **Pending Approval**: POs awaiting approval
- **Total Invoiced**: Sum of all invoices

### Purchase Order Management
- **View**: Browse all POs in the left pane
- **Search**: Find POs by ID or vendor name
- **Filter**: Filter by status (All, Approved, Pending, Matched, Rejected)
- **Create**: Click "New PO" to create a purchase order
- **Select**: Click on a PO to view related invoices

### Invoice Management
- **View**: See invoices linked to selected PO in the right pane
- **Approve**: Click "Approve" button for pending invoices
- **Reject**: Click "Reject" button to decline invoices
- **Match**: Click "Match to Budget" to link invoice to budget line
- **Attachments**: View and upload supporting documents
- **Workflow**: Track approval progress with visual indicators

## 🎨 Status Indicators

| Status | Color | Icon | Meaning |
|--------|-------|------|---------|
| Approved | Green | ✓ | PO/Invoice has been approved |
| Pending | Amber | ⏱ | Awaiting approval |
| Matched | Blue | ✓ | Invoice matched to budget |
| Rejected | Red | ✗ | PO/Invoice has been rejected |

## 🔄 Approval Workflow

### Three-Step Process
1. **Budget Verification**: Verify against budget line
2. **Manager Review**: Manager approval required
3. **Final Approval**: Final sign-off

### Status Icons
- ✅ **Green Check**: Step completed
- ⏱️ **Amber Clock**: Step pending
- ⭕ **Gray Circle**: Step not started

## 📝 Creating Purchase Orders

### Required Fields
- **Vendor**: Select or enter vendor name
- **Amount**: Total PO amount
- **Budget Line**: Link to budget category
- **Description**: PO description
- **Number of Items**: Item count

### Steps
1. Click "New PO" button
2. Fill in all required fields
3. Click "Create Purchase Order"

## 📄 Creating Invoices

### Required Fields
- **Purchase Order**: Link to existing PO
- **Amount**: Invoice amount
- **Invoice Date**: Date of invoice
- **Description**: Invoice description
- **Attachments**: Upload supporting documents

### Steps
1. Click "New Invoice" button
2. Select related purchase order
3. Fill in invoice details
4. Upload attachments (optional)
5. Click "Create Invoice"

## 🔍 Filtering & Search

### Search
- Type in the search box to filter by:
  - Purchase Order ID
  - Vendor name

### Status Filter
- **All Status**: Show all POs
- **Approved**: Show only approved POs
- **Pending**: Show only pending POs
- **Matched**: Show only matched POs
- **Rejected**: Show only rejected POs

## 📎 Attachments

### Supported Actions
- **View**: Click "View" to open attachment
- **Upload**: Click "Upload" to add new files
- **Download**: Use the "Download" button in the dropdown menu

### File Types
- PDF documents
- Images
- Supporting documentation

## ⚡ Quick Actions

### Purchase Order Actions
- Click on PO card to view related invoices
- Use search to find specific POs quickly
- Filter by status for focused view

### Invoice Actions
- **Approve**: Approve pending invoice
- **Reject**: Reject pending invoice
- **Match to Budget**: Link to budget line
- **View Details**: See full invoice information
- **Download**: Export invoice document

## 💡 Tips & Best Practices

### For Efficient Management
1. **Use Search**: Quickly find specific POs or vendors
2. **Filter by Status**: Focus on pending approvals
3. **Review Workflow**: Check approval progress before taking action
4. **Upload Documents**: Always attach supporting documents
5. **Match to Budget**: Link invoices to budget lines for tracking

### For Approval Process
1. **Verify Budget**: Ensure funds are available
2. **Check Attachments**: Review all supporting documents
3. **Validate Amount**: Confirm invoice matches PO
4. **Track Progress**: Monitor workflow completion

## 🎯 Common Tasks

### Approve an Invoice
1. Select the purchase order
2. Click on the invoice card
3. Review details and attachments
4. Click "Approve" button

### Match Invoice to Budget
1. Select the invoice
2. Click "Match to Budget"
3. Confirm the budget line assignment

### Create New Purchase Order
1. Click "New PO" button
2. Fill in vendor and amount
3. Select budget line
4. Add description
5. Submit

### Upload Invoice Attachments
1. Select the invoice
2. Click "Upload" in attachments section
3. Choose files to upload
4. Confirm upload

## 📱 Responsive Design

### Desktop View
- Full split-view layout
- All features accessible
- Optimal viewing experience

### Tablet View
- Adapted grid layout
- Scrollable sections
- Touch-friendly buttons

### Mobile View
- Stacked layout
- Simplified navigation
- Essential features prioritized

## 🔐 Permissions

### Required Access
- Property Developer role
- Project access
- Purchase order management permissions

### Available Actions by Status
- **Pending**: Approve, Reject, Match
- **Approved**: View, Download, Match
- **Matched**: View, Download
- **Rejected**: View only

## 📊 Data Display

### Purchase Order Card
- PO ID
- Vendor name
- Status badge
- Amount
- Number of items
- Date

### Invoice Card
- Invoice ID
- Status badge
- Vendor name
- Amount
- Date
- PO reference
- Budget line
- Attachments count
- Approval workflow

## 🎨 Visual Design

### Color Scheme
- **Primary**: Orange (#F97316)
- **Success**: Green (#10B981)
- **Warning**: Amber (#F59E0B)
- **Info**: Blue (#3B82F6)
- **Error**: Red (#EF4444)

### Layout
- **Left Pane**: 1/3 width - PO list
- **Right Pane**: 2/3 width - Invoice details
- **Header**: Fixed at top
- **KPIs**: 4-column grid

## 🚨 Troubleshooting

### No Invoices Showing
- Ensure a purchase order is selected
- Check if PO has any linked invoices
- Use the "Create Invoice" button to add one

### Cannot Approve Invoice
- Verify invoice status is "Pending"
- Check approval workflow progress
- Ensure you have proper permissions

### Search Not Working
- Check spelling of PO ID or vendor name
- Clear filters and try again
- Refresh the page if needed

## 📞 Support

### Need Help?
- Review the full implementation documentation
- Check the Figma design for reference
- Contact system administrator for access issues

---

**Quick Access**: Developer Dashboard → Select Project → Purchase Orders

**Last Updated**: November 12, 2025

