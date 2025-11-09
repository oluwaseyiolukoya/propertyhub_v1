# 🏗️ Onboarding System Architecture

## Executive Summary

This document outlines the database architecture and implementation strategy for a secure, scalable onboarding system that tracks user registrations from the public "Get Started" page through admin review and activation.

## 📋 Table of Contents

1. [Database Schema Design](#database-schema-design)
2. [Workflow & State Machine](#workflow--state-machine)
3. [Security Considerations](#security-considerations)
4. [API Endpoints](#api-endpoints)
5. [Admin Dashboard Features](#admin-dashboard-features)
6. [Implementation Steps](#implementation-steps)

---

## 1. Database Schema Design

### Current Analysis

**Existing Tables:**

- ✅ `customers` - For Property Owners/Managers (B2B customers)
- ✅ `users` - For internal users (managers, tenants) under a customer
- ✅ `admins` - For super admins
- ❌ **Missing**: Onboarding/Registration tracking table

### Recommended Approach: Add `onboarding_applications` Table

```prisma
model onboarding_applications {
  id                    String    @id @default(uuid())

  // Applicant Information
  applicationType       String    // 'property-owner' | 'property-manager' | 'tenant'

  // Personal Details
  name                  String
  email                 String    @unique
  phone                 String?

  // Property Owner Specific Fields
  companyName           String?
  businessType          String?   // 'individual' | 'company' | 'partnership'
  numberOfProperties    Int?
  totalUnits            Int?
  website               String?
  taxId                 String?

  // Property Manager Specific Fields
  yearsOfExperience     Int?
  managementCompany     String?
  licenseNumber         String?
  propertiesManaged     Int?

  // Tenant Specific Fields
  currentlyRenting      String?   // 'yes' | 'no' | 'looking'
  moveInDate            DateTime?
  employmentStatus      String?

  // Address Information
  street                String?
  city                  String?
  state                 String?
  postalCode            String?
  country               String    @default("Nigeria")

  // Application Status & Workflow
  status                String    @default("pending")
  // Status flow: pending -> under_review -> approved -> rejected -> activated

  reviewStatus          String?   // 'pending' | 'in_progress' | 'completed'
  reviewNotes           String?   // Admin's internal notes
  rejectionReason       String?   // Reason if rejected

  // Admin Actions
  reviewedBy            String?   // Admin ID who reviewed
  reviewedAt            DateTime?
  approvedBy            String?   // Admin ID who approved
  approvedAt            DateTime?
  activatedBy           String?   // Admin ID who activated
  activatedAt           DateTime?

  // Plan Selection
  selectedPlanId        String?
  selectedBillingCycle  String?   // 'monthly' | 'annual'

  // Generated IDs (after approval)
  customerId            String?   @unique // Links to customers table after activation
  userId                String?   @unique // Links to users table if needed

  // Metadata
  ipAddress             String?
  userAgent             String?
  referralSource        String?
  metadata              Json?     // Additional flexible data

  // Timestamps
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt

  // Relations
  reviewer              admins?   @relation("reviewed_by", fields: [reviewedBy], references: [id])
  approver              admins?   @relation("approved_by", fields: [approvedBy], references: [id])
  activator             admins?   @relation("activated_by", fields: [activatedBy], references: [id])
  customer              customers? @relation(fields: [customerId], references: [id])
  plan                  plans?    @relation(fields: [selectedPlanId], references: [id])

  @@index([status])
  @@index([applicationType])
  @@index([email])
  @@index([createdAt])
  @@index([reviewStatus])
}
```

### Update `admins` Table

```prisma
model admins {
  id                              String                    @id
  email                           String                    @unique
  password                        String
  name                            String
  role                            String                    @default("super_admin")
  isActive                        Boolean                   @default(true)
  createdAt                       DateTime                  @default(now())
  updatedAt                       DateTime
  lastLogin                       DateTime?

  // New relations for onboarding
  reviewed_applications           onboarding_applications[] @relation("reviewed_by")
  approved_applications           onboarding_applications[] @relation("approved_by")
  activated_applications          onboarding_applications[] @relation("activated_by")
}
```

### Update `customers` Table

```prisma
model customers {
  // ... existing fields ...

  // New field
  onboardingApplicationId  String?                   @unique
  onboarding_application   onboarding_applications?  @relation(fields: [onboardingApplicationId], references: [id])

  // ... rest of existing fields ...
}
```

---

## 2. Workflow & State Machine

### Application Status Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    APPLICATION LIFECYCLE                     │
└─────────────────────────────────────────────────────────────┘

1. PENDING (Initial State)
   ↓
   User submits application from "Get Started" page
   - Email verification sent (optional)
   - Admin notification triggered

2. UNDER_REVIEW
   ↓
   Admin opens application in dashboard
   - Status auto-changes to "under_review"
   - Admin can add review notes
   - Admin can request more information

3a. APPROVED                    3b. REJECTED
    ↓                               ↓
    Admin approves application      Admin rejects with reason
    - Customer record created       - Email sent to applicant
    - Trial period starts           - Application archived
    - Welcome email sent            - Can reapply after 30 days

4. ACTIVATED
   ↓
   Admin manually activates account OR auto-activated after approval
   - Login credentials generated
   - Password setup email sent
   - Customer can now login
   - Trial period begins

5. ACTIVE (Customer in system)
   ↓
   Customer successfully logged in and using platform
```

### Status Definitions

| Status           | Description              | Actions Available             | Next States                              |
| ---------------- | ------------------------ | ----------------------------- | ---------------------------------------- |
| `pending`        | Initial submission       | Review, Reject                | `under_review`, `rejected`               |
| `under_review`   | Admin reviewing          | Approve, Reject, Request Info | `approved`, `rejected`, `info_requested` |
| `info_requested` | More info needed         | Submit Info                   | `under_review`                           |
| `approved`       | Application approved     | Activate                      | `activated`                              |
| `rejected`       | Application denied       | Archive                       | -                                        |
| `activated`      | Account created & active | Login                         | -                                        |

---

## 3. Security Considerations

### Best Practices Implemented

#### 3.1 Data Protection

```typescript
// ✅ Store sensitive data encrypted
- Tax IDs encrypted at rest
- License numbers encrypted
- Personal identification documents

// ✅ PII (Personally Identifiable Information) handling
- GDPR/CCPA compliant data storage
- Right to be forgotten implementation
- Data retention policies (delete rejected apps after 90 days)
```

#### 3.2 Access Control

```typescript
// ✅ Role-based permissions
- Only super_admins can approve/reject
- Admins can review and add notes
- Audit trail for all actions
```

#### 3.3 Rate Limiting

```typescript
// ✅ Prevent abuse
- Max 3 applications per email per 30 days
- IP-based rate limiting (5 applications per IP per day)
- Email verification required
```

#### 3.4 Data Validation

```typescript
// ✅ Input sanitization
- Email format validation
- Phone number validation
- Business registration number verification (optional integration)
- Address verification (optional integration)
```

---

## 4. API Endpoints

### Public Endpoints (No Auth Required)

#### POST `/api/onboarding/apply`

Submit new application from "Get Started" page

**Request Body:**

```json
{
  "applicationType": "property-owner",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+234-xxx-xxxx",
  "companyName": "ABC Properties Ltd",
  "businessType": "company",
  "numberOfProperties": 5,
  "totalUnits": 50,
  "website": "https://abcproperties.com",
  "taxId": "12345678",
  "street": "123 Main St",
  "city": "Lagos",
  "state": "Lagos",
  "country": "Nigeria",
  "selectedPlanId": "plan-professional",
  "selectedBillingCycle": "monthly",
  "referralSource": "google"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Application submitted successfully",
  "data": {
    "applicationId": "uuid",
    "status": "pending",
    "estimatedReviewTime": "24-48 hours"
  }
}
```

#### GET `/api/onboarding/status/:email`

Check application status (rate-limited)

**Response:**

```json
{
  "status": "under_review",
  "submittedAt": "2025-01-15T10:00:00Z",
  "message": "Your application is currently under review"
}
```

---

### Admin Endpoints (Auth Required)

#### GET `/api/admin/onboarding/applications`

List all applications with filters

**Query Parameters:**

- `status`: Filter by status
- `applicationType`: Filter by type
- `page`: Pagination
- `limit`: Items per page
- `sortBy`: Sort field
- `sortOrder`: asc/desc
- `search`: Search by name/email

**Response:**

```json
{
  "success": true,
  "data": {
    "applications": [...],
    "pagination": {
      "total": 150,
      "page": 1,
      "limit": 20,
      "totalPages": 8
    },
    "stats": {
      "pending": 45,
      "under_review": 12,
      "approved": 78,
      "rejected": 15
    }
  }
}
```

#### GET `/api/admin/onboarding/applications/:id`

Get single application details

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "applicationType": "property-owner",
    "name": "John Doe",
    "email": "john@example.com",
    "status": "pending",
    "reviewNotes": null,
    "createdAt": "2025-01-15T10:00:00Z",
    "timeline": [
      {
        "action": "submitted",
        "timestamp": "2025-01-15T10:00:00Z",
        "actor": "System"
      }
    ]
  }
}
```

#### PUT `/api/admin/onboarding/applications/:id/review`

Update review status and add notes

**Request Body:**

```json
{
  "reviewStatus": "in_progress",
  "reviewNotes": "Verifying business registration..."
}
```

#### POST `/api/admin/onboarding/applications/:id/approve`

Approve application

**Request Body:**

```json
{
  "planId": "plan-professional",
  "billingCycle": "monthly",
  "trialDays": 14,
  "notes": "Approved - verified business registration"
}
```

**Actions Performed:**

1. Create customer record
2. Set trial period
3. Generate temporary password
4. Send welcome email
5. Update application status to "approved"

#### POST `/api/admin/onboarding/applications/:id/activate`

Activate approved application

**Actions Performed:**

1. Set customer status to "active"
2. Send password setup email
3. Update application status to "activated"
4. Create activity log

#### POST `/api/admin/onboarding/applications/:id/reject`

Reject application

**Request Body:**

```json
{
  "reason": "Incomplete business documentation",
  "message": "Please provide valid business registration certificate"
}
```

#### POST `/api/admin/onboarding/applications/:id/request-info`

Request additional information

**Request Body:**

```json
{
  "requestedInfo": [
    "Business registration certificate",
    "Proof of property ownership"
  ],
  "message": "Please provide the following documents..."
}
```

---

## 5. Admin Dashboard Features

### 5.1 Onboarding Management Page

**Location:** `/admin/onboarding` or `/admin/applications`

**Features:**

#### Dashboard Overview

```
┌─────────────────────────────────────────────────────────┐
│  📊 ONBOARDING DASHBOARD                                │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐│
│  │ PENDING  │  │  REVIEW  │  │ APPROVED │  │REJECTED ││
│  │   45     │  │    12    │  │    78    │  │   15    ││
│  └──────────┘  └──────────┘  └──────────┘  └─────────┘│
│                                                          │
│  Recent Applications (Last 7 days): 23                  │
│  Avg Review Time: 18 hours                              │
│  Approval Rate: 83%                                      │
│                                                          │
├─────────────────────────────────────────────────────────┤
│  Filters: [All Types ▼] [All Status ▼] [🔍 Search]     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Applications List                                       │
│  ┌────────────────────────────────────────────────────┐│
│  │ John Doe | Property Owner | Pending | 2 hours ago ││
│  │ [View Details] [Quick Approve] [Reject]            ││
│  ├────────────────────────────────────────────────────┤│
│  │ Jane Smith | Manager | Under Review | 1 day ago   ││
│  │ [View Details] [Approve] [Request Info]            ││
│  └────────────────────────────────────────────────────┘│
│                                                          │
└─────────────────────────────────────────────────────────┘
```

#### Application Detail View

```
┌─────────────────────────────────────────────────────────┐
│  📋 APPLICATION DETAILS                                  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Status: [PENDING] ⏱️                                   │
│  Submitted: Jan 15, 2025 10:00 AM                       │
│  Application ID: APP-2025-001234                         │
│                                                          │
│  ┌─ APPLICANT INFORMATION ────────────────────────────┐│
│  │ Name: John Doe                                      ││
│  │ Email: john@example.com                             ││
│  │ Phone: +234-xxx-xxxx                                ││
│  │ Type: Property Owner                                ││
│  └─────────────────────────────────────────────────────┘│
│                                                          │
│  ┌─ BUSINESS INFORMATION ─────────────────────────────┐│
│  │ Company: ABC Properties Ltd                         ││
│  │ Business Type: Company                              ││
│  │ Tax ID: ********78 [View]                           ││
│  │ Website: abcproperties.com                          ││
│  │ Properties: 5 | Units: 50                           ││
│  └─────────────────────────────────────────────────────┘│
│                                                          │
│  ┌─ SELECTED PLAN ────────────────────────────────────┐│
│  │ Plan: Professional ($799/month)                     ││
│  │ Billing: Monthly                                    ││
│  │ Trial: 14 days                                      ││
│  └─────────────────────────────────────────────────────┘│
│                                                          │
│  ┌─ REVIEW NOTES ─────────────────────────────────────┐│
│  │ [Add internal notes visible only to admins...]      ││
│  │                                                      ││
│  └─────────────────────────────────────────────────────┘│
│                                                          │
│  ┌─ TIMELINE ─────────────────────────────────────────┐│
│  │ ● Jan 15, 10:00 AM - Application submitted          ││
│  │ ○ Pending admin review                              ││
│  └─────────────────────────────────────────────────────┘│
│                                                          │
│  Actions:                                                │
│  [✓ Approve] [✗ Reject] [📝 Request Info] [💬 Contact] │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### 5.2 Key Features

#### Bulk Actions

- Bulk approve (with validation)
- Bulk reject
- Bulk export to CSV

#### Notifications

- Real-time notifications for new applications
- Daily digest email for pending applications
- Slack/Discord integration (optional)

#### Analytics

- Application trends (daily/weekly/monthly)
- Approval/rejection rates
- Average review time
- Application sources (referrals)
- Conversion funnel

#### Search & Filters

- Full-text search (name, email, company)
- Filter by status, type, date range
- Sort by date, name, status
- Saved filter presets

---

## 6. Implementation Steps

### Phase 1: Database Setup (Week 1)

**Step 1.1: Create Migration**

```bash
# Create new migration file
npx prisma migrate dev --name add_onboarding_applications
```

**Step 1.2: Update Schema**

- Add `onboarding_applications` table
- Update `admins` table with relations
- Update `customers` table with `onboardingApplicationId`

**Step 1.3: Run Migration**

```bash
npx prisma migrate deploy
npx prisma generate
```

### Phase 2: Backend API (Week 1-2)

**Step 2.1: Create Controllers**

```
backend/src/controllers/
  ├── onboarding.ts          # Public onboarding endpoints
  └── admin-onboarding.ts    # Admin management endpoints
```

**Step 2.2: Create Services**

```
backend/src/services/
  ├── onboarding.service.ts  # Business logic
  └── email.service.ts       # Email notifications
```

**Step 2.3: Create Routes**

```
backend/src/routes/
  ├── onboarding.ts          # Public routes
  └── admin-onboarding.ts    # Admin routes
```

**Step 2.4: Add Validation**

```typescript
// backend/src/validators/onboarding.validator.ts
import { z } from "zod";

export const applicationSchema = z.object({
  applicationType: z.enum(["property-owner", "property-manager", "tenant"]),
  name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().optional(),
  // ... more fields
});
```

### Phase 3: Frontend - Public Page (Week 2)

**Step 3.1: Update GetStartedPage**

- Connect form to backend API
- Add form validation
- Add success/error handling
- Add loading states

**Step 3.2: Create Status Check Page**

```
src/components/ApplicationStatusPage.tsx
```

### Phase 4: Frontend - Admin Dashboard (Week 2-3)

**Step 4.1: Create Components**

```
src/components/admin/
  ├── OnboardingDashboard.tsx      # Main dashboard
  ├── ApplicationsList.tsx          # List view
  ├── ApplicationDetail.tsx         # Detail view
  ├── ApplicationFilters.tsx        # Filters
  ├── ApplicationStats.tsx          # Statistics
  ├── ApprovalDialog.tsx            # Approval modal
  ├── RejectionDialog.tsx           # Rejection modal
  └── RequestInfoDialog.tsx         # Request info modal
```

**Step 4.2: Add to Admin Navigation**

```typescript
// Add to SuperAdminDashboard navigation
{
  name: 'Onboarding',
  icon: UserPlus,
  path: '/admin/onboarding',
  badge: pendingCount > 0 ? pendingCount : undefined
}
```

### Phase 5: Email Notifications (Week 3)

**Step 5.1: Create Email Templates**

```
backend/src/templates/
  ├── application-received.html     # Confirmation email
  ├── application-approved.html     # Approval email
  ├── application-rejected.html     # Rejection email
  ├── info-requested.html           # Request more info
  └── account-activated.html        # Activation email
```

**Step 5.2: Implement Email Service**

```typescript
// backend/src/services/email.service.ts
export class OnboardingEmailService {
  async sendApplicationReceived(application: OnboardingApplication) {}
  async sendApplicationApproved(application: OnboardingApplication) {}
  async sendApplicationRejected(
    application: OnboardingApplication,
    reason: string
  ) {}
  async sendInfoRequested(application: OnboardingApplication, info: string[]) {}
  async sendAccountActivated(customer: Customer, tempPassword: string) {}
}
```

### Phase 6: Testing (Week 3-4)

**Step 6.1: Unit Tests**

- Test all service methods
- Test validation schemas
- Test email sending

**Step 6.2: Integration Tests**

- Test complete application flow
- Test admin approval/rejection flow
- Test email delivery

**Step 6.3: E2E Tests**

- Test public application submission
- Test admin dashboard interactions
- Test account activation

### Phase 7: Security & Optimization (Week 4)

**Step 7.1: Security Audit**

- Rate limiting implementation
- Input sanitization
- SQL injection prevention
- XSS prevention

**Step 7.2: Performance Optimization**

- Database indexing
- Query optimization
- Caching strategy
- Background job processing

### Phase 8: Deployment (Week 4)

**Step 8.1: Environment Variables**

```env
# .env
ONBOARDING_AUTO_APPROVE=false
ONBOARDING_TRIAL_DAYS=14
ONBOARDING_ADMIN_EMAIL=admin@contrezz.com
ONBOARDING_NOTIFICATION_SLACK_WEBHOOK=https://...
```

**Step 8.2: Database Migration**

```bash
# Production migration
npx prisma migrate deploy
```

**Step 8.3: Monitoring**

- Set up error tracking (Sentry)
- Set up application metrics
- Set up email delivery monitoring

---

## 7. Best Practices Summary

### ✅ DO's

1. **Separate Concerns**

   - Keep onboarding data separate from active customers
   - Use dedicated table for applications
   - Clear state transitions

2. **Audit Everything**

   - Log all admin actions
   - Track who approved/rejected
   - Maintain timeline of events

3. **Security First**

   - Encrypt sensitive data
   - Rate limit submissions
   - Validate all inputs
   - Use HTTPS only

4. **User Experience**

   - Clear status updates
   - Email notifications
   - Estimated review times
   - Easy status checking

5. **Admin Efficiency**
   - Quick approve/reject actions
   - Bulk operations
   - Smart filters
   - Dashboard analytics

### ❌ DON'Ts

1. **Don't** create customer accounts before approval
2. **Don't** store passwords in onboarding table
3. **Don't** allow unlimited resubmissions
4. **Don't** expose sensitive admin notes to applicants
5. **Don't** auto-approve without validation

---

## 8. Future Enhancements

### Phase 2 Features (Post-MVP)

1. **Document Upload**

   - Business registration
   - ID verification
   - Property ownership proof

2. **Video KYC**

   - Live video verification
   - Identity confirmation

3. **Automated Verification**

   - Business registry API integration
   - Credit check integration
   - Background check integration

4. **Advanced Analytics**

   - Predictive approval scoring
   - Fraud detection
   - Application quality scoring

5. **Multi-step Review**

   - Level 1: Basic verification
   - Level 2: Document review
   - Level 3: Final approval

6. **Applicant Portal**
   - Track application status
   - Upload additional documents
   - Chat with admin

---

## 9. Database Migration Script

```prisma
-- CreateTable
CREATE TABLE "onboarding_applications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "applicationType" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL UNIQUE,
    "phone" TEXT,
    "companyName" TEXT,
    "businessType" TEXT,
    "numberOfProperties" INTEGER,
    "totalUnits" INTEGER,
    "website" TEXT,
    "taxId" TEXT,
    "yearsOfExperience" INTEGER,
    "managementCompany" TEXT,
    "licenseNumber" TEXT,
    "propertiesManaged" INTEGER,
    "currentlyRenting" TEXT,
    "moveInDate" TIMESTAMP,
    "employmentStatus" TEXT,
    "street" TEXT,
    "city" TEXT,
    "state" TEXT,
    "postalCode" TEXT,
    "country" TEXT NOT NULL DEFAULT 'Nigeria',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reviewStatus" TEXT,
    "reviewNotes" TEXT,
    "rejectionReason" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP,
    "activatedBy" TEXT,
    "activatedAt" TIMESTAMP,
    "selectedPlanId" TEXT,
    "selectedBillingCycle" TEXT,
    "customerId" TEXT UNIQUE,
    "userId" TEXT UNIQUE,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "referralSource" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,

    CONSTRAINT "fk_reviewer" FOREIGN KEY ("reviewedBy") REFERENCES "admins"("id"),
    CONSTRAINT "fk_approver" FOREIGN KEY ("approvedBy") REFERENCES "admins"("id"),
    CONSTRAINT "fk_activator" FOREIGN KEY ("activatedBy") REFERENCES "admins"("id"),
    CONSTRAINT "fk_customer" FOREIGN KEY ("customerId") REFERENCES "customers"("id"),
    CONSTRAINT "fk_plan" FOREIGN KEY ("selectedPlanId") REFERENCES "plans"("id")
);

-- CreateIndex
CREATE INDEX "idx_onboarding_status" ON "onboarding_applications"("status");
CREATE INDEX "idx_onboarding_type" ON "onboarding_applications"("applicationType");
CREATE INDEX "idx_onboarding_email" ON "onboarding_applications"("email");
CREATE INDEX "idx_onboarding_created" ON "onboarding_applications"("createdAt");
CREATE INDEX "idx_onboarding_review_status" ON "onboarding_applications"("reviewStatus");
```

---

## 10. Conclusion

This architecture provides:

✅ **Scalability** - Handles growing application volume  
✅ **Security** - Protects sensitive applicant data  
✅ **Traceability** - Full audit trail of all actions  
✅ **Flexibility** - Easy to extend with new features  
✅ **User-Friendly** - Clear workflow for admins and applicants  
✅ **Best Practices** - Follows industry standards

**Next Steps:**

1. Review and approve architecture
2. Begin Phase 1 implementation
3. Set up development environment
4. Create first migration

---

**Document Version:** 1.0  
**Last Updated:** November 8, 2025  
**Author:** Database Architecture Team  
**Status:** Ready for Implementation
