# Developer Dashboard - Quick Start Guide

## 🚀 Getting Started

This guide will help you quickly set up and test the new Property Developer Dashboard.

## Step 1: Database Setup

The database schema has already been updated. If you need to apply the changes:

```bash
cd backend
npx prisma db push
# or
npx prisma migrate dev --name add_developer_dashboard
```

## Step 2: Create a Test Developer User

Add this to your `backend/prisma/seed.ts` file or run directly in Prisma Studio:

```typescript
// In seed.ts, add this after creating customers:

// Create a developer user
const developerUser = await prisma.users.create({
  data: {
    id: "dev-user-001",
    customerId: customers[0].id, // Use first customer
    name: "John Developer",
    email: "developer@contrezz.com",
    password: await bcrypt.hash("developer123", 10),
    role: "developer",
    isActive: true,
    status: "active",
  },
});

console.log("✅ Developer user created:", developerUser.email);

// Create sample projects
const project1 = await prisma.developer_projects.create({
  data: {
    customerId: customers[0].id,
    developerId: developerUser.id,
    name: "Lekki Heights Residential Complex",
    description: "50-unit luxury apartment complex in Lekki Phase 1, Lagos",
    projectType: "residential",
    stage: "construction",
    status: "active",
    startDate: new Date("2024-01-15"),
    estimatedEndDate: new Date("2025-06-30"),
    location: "Lekki Phase 1",
    city: "Lagos",
    state: "Lagos",
    country: "Nigeria",
    totalBudget: 500000000, // ₦500M
    actualSpend: 320000000, // ₦320M
    progress: 64,
    currency: "NGN",
  },
});

const project2 = await prisma.developer_projects.create({
  data: {
    customerId: customers[0].id,
    developerId: developerUser.id,
    name: "Victoria Island Commercial Tower",
    description: "15-story office building in Victoria Island",
    projectType: "commercial",
    stage: "design",
    status: "active",
    startDate: new Date("2024-03-01"),
    estimatedEndDate: new Date("2026-12-31"),
    location: "Victoria Island",
    city: "Lagos",
    state: "Lagos",
    country: "Nigeria",
    totalBudget: 1200000000, // ₦1.2B
    actualSpend: 150000000, // ₦150M
    progress: 12,
    currency: "NGN",
  },
});

const project3 = await prisma.developer_projects.create({
  data: {
    customerId: customers[0].id,
    developerId: developerUser.id,
    name: "Ikoyi Luxury Villas",
    description: "10 detached luxury villas in Ikoyi",
    projectType: "residential",
    stage: "completion",
    status: "active",
    startDate: new Date("2023-06-01"),
    estimatedEndDate: new Date("2024-12-31"),
    location: "Ikoyi",
    city: "Lagos",
    state: "Lagos",
    country: "Nigeria",
    totalBudget: 800000000, // ₦800M
    actualSpend: 750000000, // ₦750M
    progress: 94,
    currency: "NGN",
  },
});

console.log("✅ Created 3 sample projects");

// Add budget line items for project 1
await prisma.budget_line_items.createMany({
  data: [
    {
      projectId: project1.id,
      category: "materials",
      subcategory: "Structural",
      description: "Cement, steel, blocks, and structural materials",
      plannedAmount: 150000000,
      actualAmount: 145000000,
      variance: -5000000,
      variancePercent: -3.33,
      status: "in-progress",
    },
    {
      projectId: project1.id,
      category: "labor",
      subcategory: "Construction",
      description: "Construction workers, masons, and contractors",
      plannedAmount: 120000000,
      actualAmount: 135000000,
      variance: 15000000,
      variancePercent: 12.5,
      status: "overrun",
    },
    {
      projectId: project1.id,
      category: "equipment",
      subcategory: "Heavy Machinery",
      description: "Excavators, cranes, and construction equipment",
      plannedAmount: 80000000,
      actualAmount: 40000000,
      variance: -40000000,
      variancePercent: -50,
      status: "in-progress",
    },
    {
      projectId: project1.id,
      category: "professional-fees",
      subcategory: "Architects & Engineers",
      description: "Architectural and engineering services",
      plannedAmount: 50000000,
      actualAmount: 50000000,
      variance: 0,
      variancePercent: 0,
      status: "completed",
    },
    {
      projectId: project1.id,
      category: "permits",
      subcategory: "Government Approvals",
      description: "Building permits and government approvals",
      plannedAmount: 30000000,
      actualAmount: 35000000,
      variance: 5000000,
      variancePercent: 16.67,
      status: "completed",
    },
    {
      projectId: project1.id,
      category: "contingency",
      description: "Contingency fund for unexpected costs",
      plannedAmount: 70000000,
      actualAmount: 15000000,
      variance: -55000000,
      variancePercent: -78.57,
      status: "pending",
    },
  ],
});

console.log("✅ Added budget line items for Lekki Heights project");

// Create sample vendors
const vendor1 = await prisma.project_vendors.create({
  data: {
    customerId: customers[0].id,
    name: "Lagos Construction Materials Ltd",
    contactPerson: "Ade Johnson",
    email: "ade@lcm.com",
    phone: "+234-801-234-5678",
    vendorType: "supplier",
    specialization: "Building materials",
    rating: 4.5,
    totalContracts: 5,
    totalValue: 250000000,
    currency: "NGN",
    status: "active",
  },
});

const vendor2 = await prisma.project_vendors.create({
  data: {
    customerId: customers[0].id,
    name: "Elite Contractors Nigeria",
    contactPerson: "Chidi Okafor",
    email: "chidi@elitecontractors.ng",
    phone: "+234-802-345-6789",
    vendorType: "contractor",
    specialization: "General contracting",
    rating: 4.8,
    totalContracts: 12,
    totalValue: 800000000,
    currency: "NGN",
    status: "active",
  },
});

console.log("✅ Created 2 sample vendors");

// Create sample invoices
await prisma.project_invoices.createMany({
  data: [
    {
      projectId: project1.id,
      vendorId: vendor1.id,
      invoiceNumber: "INV-2024-001",
      description: "Q1 2024 - Cement and steel delivery",
      category: "materials",
      amount: 45000000,
      currency: "NGN",
      status: "paid",
      dueDate: new Date("2024-03-31"),
      paidDate: new Date("2024-03-28"),
      paymentMethod: "bank-transfer",
    },
    {
      projectId: project1.id,
      vendorId: vendor2.id,
      invoiceNumber: "INV-2024-002",
      description: "April 2024 - Labor and construction services",
      category: "labor",
      amount: 35000000,
      currency: "NGN",
      status: "approved",
      dueDate: new Date("2024-05-15"),
    },
    {
      projectId: project1.id,
      vendorId: vendor1.id,
      invoiceNumber: "INV-2024-003",
      description: "May 2024 - Additional materials",
      category: "materials",
      amount: 28000000,
      currency: "NGN",
      status: "pending",
      dueDate: new Date("2024-06-10"),
    },
  ],
});

console.log("✅ Created 3 sample invoices");
```

## Step 3: Run the Seed Script

```bash
cd backend
npm run prisma:seed
```

## Step 4: Start Your Servers

Make sure all servers are running:

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
npm run dev

# Terminal 3 - Prisma Studio (optional, for database viewing)
cd backend
npx prisma studio
```

## Step 5: Login as Developer

1. Open your browser to `http://localhost:5173`
2. Login with:
   - **Email:** `developer@contrezz.com`
   - **Password:** `developer123`

## Step 6: Explore the Dashboard

You should now see the Developer Dashboard with:

### Portfolio Overview

- 3 sample projects displayed in cards
- KPI cards showing:
  - Total Projects: 3
  - Total Budget: ₦2.5B
  - Actual Spend: ₦1.22B
  - Budget Variance

### Try These Features:

1. **Search:** Type "Lekki" in the search box
2. **Filter:** Filter by status (Active) or stage (Construction)
3. **Sort:** Sort by budget (high to low)
4. **View Project:** Click on "Lekki Heights" to see details

### Project Dashboard

When viewing a project, you'll see:

- Progress bar (64% for Lekki Heights)
- KPI cards with budget metrics
- Budget vs Actual chart
- Budget line items table
- Invoices list
- Alerts for budget overruns

## 🎯 Test Scenarios

### Scenario 1: View Budget Details

1. Click on "Lekki Heights Residential Complex"
2. Navigate to "Budget Details" tab
3. See 6 budget line items
4. Notice the "Labor" category is over budget (red indicator)

### Scenario 2: Check Alerts

1. On the project dashboard, scroll to "Active Alerts"
2. You should see alerts for:
   - Budget overrun in Labor category
   - Pending invoices awaiting approval

### Scenario 3: View Invoices

1. Navigate to "Invoices" tab
2. See 3 invoices with different statuses:
   - Paid (green badge)
   - Approved (blue badge)
   - Pending (gray badge)

### Scenario 4: Filter Projects

1. Go back to Portfolio Overview
2. Filter by Stage: "Construction"
3. Only "Lekki Heights" should appear
4. Clear filter and try Status: "Active"
5. All 3 projects should appear

## 📊 Understanding the Data

### Budget Categories

- **Materials:** Construction materials (cement, steel, blocks)
- **Labor:** Workers and contractors
- **Equipment:** Heavy machinery and tools
- **Professional Fees:** Architects, engineers, consultants
- **Permits:** Government approvals and licenses
- **Contingency:** Buffer for unexpected costs

### Project Stages

- **Planning:** Initial planning phase
- **Design:** Architectural design phase
- **Pre-Construction:** Site preparation
- **Construction:** Active construction
- **Completion:** Final touches and handover

### Project Status

- **Active:** Currently ongoing
- **On-Hold:** Temporarily paused
- **Completed:** Finished projects
- **Cancelled:** Terminated projects

## 🔧 Troubleshooting

### Dashboard Not Showing?

- Check that user role is `developer` or `property-developer`
- Verify user is logged in
- Check browser console for errors

### No Projects Visible?

- Ensure seed script ran successfully
- Check that projects have correct `developerId` and `customerId`
- Verify database connection

### API Errors?

- Check backend server is running
- Verify API endpoint: `http://localhost:5000/api/developer-dashboard/portfolio/overview`
- Check authentication token is valid

## 📝 Next Steps

1. **Create Your Own Project:**

   - Click "New Project" button
   - Fill in project details
   - Add budget line items

2. **Customize the Dashboard:**

   - Modify colors in components
   - Add additional KPI cards
   - Create custom charts

3. **Extend Functionality:**
   - Implement CSV import for budgets
   - Add report generation
   - Create milestone tracking UI

## 🎉 Success!

You now have a fully functional Property Developer Dashboard! The dashboard provides:

✅ Portfolio overview with multiple projects
✅ Detailed project dashboards
✅ Budget tracking and variance analysis
✅ Invoice management
✅ Visual analytics with charts
✅ Alert system for overruns
✅ Responsive design
✅ Real-time data updates

Happy developing! 🏗️
