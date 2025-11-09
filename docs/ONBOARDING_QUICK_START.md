# 🚀 Onboarding System - Quick Start Guide

## TL;DR - What We're Building

A secure onboarding system where:
1. Users register via public "Get Started" page
2. Applications go to `onboarding_applications` table (NOT `customers`)
3. Admins review applications in dashboard
4. Upon approval, customer account is created
5. Upon activation, customer can login

## Key Architecture Decision

### ❌ OLD WAY (Bad Practice)
```
User Submits Form → Create Customer → Set status="pending" → Admin reviews
```
**Problems:**
- Clutters customers table with unverified users
- Difficult to manage rejected applications
- No clear separation of concerns
- Hard to track application history

### ✅ NEW WAY (Best Practice)
```
User Submits Form → Create Application → Admin reviews → Approve → Create Customer → Activate
```
**Benefits:**
- Clean separation of applicants vs customers
- Easy to manage workflow states
- Complete audit trail
- Can reject without affecting customer data

## Database Tables

### New Table: `onboarding_applications`
```
Purpose: Track all registration applications
Status Flow: pending → under_review → approved/rejected → activated
```

### Existing Table: `customers`
```
Purpose: Only active/approved customers
Status: trial, active, cancelled, suspended
```

### Relationship
```
onboarding_applications.customerId → customers.id
(Only set after approval)
```

## Status Workflow

```
┌──────────┐
│ PENDING  │ ← User submits application
└────┬─────┘
     │
     ↓
┌──────────────┐
│ UNDER_REVIEW │ ← Admin opens application
└───┬──────┬───┘
    │      │
    ↓      ↓
┌─────────┐  ┌──────────┐
│APPROVED │  │ REJECTED │
└────┬────┘  └──────────┘
     │
     ↓
┌───────────┐
│ ACTIVATED │ ← Customer can now login
└───────────┘
```

## Implementation Checklist

### Phase 1: Database (Day 1)
- [ ] Add `onboarding_applications` table to schema.prisma
- [ ] Update `admins` table with relations
- [ ] Run migration
- [ ] Test with sample data

### Phase 2: Backend API (Day 2-3)
- [ ] Create `/api/onboarding/apply` endpoint (public)
- [ ] Create `/api/admin/onboarding/*` endpoints (admin only)
- [ ] Add validation with Zod
- [ ] Add rate limiting
- [ ] Test all endpoints

### Phase 3: Frontend - Public (Day 4)
- [ ] Update GetStartedPage to call API
- [ ] Add form validation
- [ ] Add success/error messages
- [ ] Test user flow

### Phase 4: Frontend - Admin (Day 5-6)
- [ ] Create OnboardingDashboard component
- [ ] Create ApplicationsList component
- [ ] Create ApplicationDetail component
- [ ] Add approve/reject actions
- [ ] Test admin workflow

### Phase 5: Email Notifications (Day 7)
- [ ] Create email templates
- [ ] Implement email service
- [ ] Test email delivery
- [ ] Add email logging

### Phase 6: Testing & Deployment (Day 8)
- [ ] Write unit tests
- [ ] Write integration tests
- [ ] Security audit
- [ ] Deploy to production

## Quick API Reference

### Public Endpoint
```typescript
POST /api/onboarding/apply
{
  "applicationType": "property-owner",
  "name": "John Doe",
  "email": "john@example.com",
  "companyName": "ABC Properties",
  "numberOfProperties": 5,
  "selectedPlanId": "plan-professional"
}
```

### Admin Endpoints
```typescript
GET    /api/admin/onboarding/applications          // List all
GET    /api/admin/onboarding/applications/:id      // Get one
PUT    /api/admin/onboarding/applications/:id/review
POST   /api/admin/onboarding/applications/:id/approve
POST   /api/admin/onboarding/applications/:id/reject
POST   /api/admin/onboarding/applications/:id/activate
```

## Admin Dashboard Location

Add to SuperAdminDashboard navigation:
```typescript
{
  name: 'Onboarding',
  icon: UserPlus,
  path: '/admin/onboarding',
  badge: pendingApplicationsCount
}
```

## Security Checklist

- [x] Rate limit submissions (3 per email per 30 days)
- [x] Validate all inputs
- [x] Encrypt sensitive data (taxId, licenseNumber)
- [x] Admin-only access to management endpoints
- [x] Audit trail for all actions
- [x] Email verification (optional)
- [x] HTTPS only

## Key Benefits

### For Admins
✅ Clear dashboard of pending applications  
✅ One-click approve/reject  
✅ Complete application history  
✅ Analytics and reporting  
✅ Bulk operations  

### For Applicants
✅ Easy application process  
✅ Status tracking  
✅ Email notifications  
✅ Clear next steps  

### For System
✅ Clean data separation  
✅ Easy to scale  
✅ Audit trail  
✅ Flexible workflow  
✅ Security best practices  

## Next Steps

1. **Review** the full architecture document: `docs/ONBOARDING_ARCHITECTURE.md`
2. **Approve** the database schema design
3. **Start** with Phase 1 (Database Setup)
4. **Test** each phase before moving to next

## Questions?

- How long should trial period be? (Default: 14 days)
- Auto-approve or manual approve? (Recommend: manual)
- Email verification required? (Recommend: yes)
- Document upload required? (Phase 2 feature)

---

**Ready to implement?** Let's start with the database migration! 🚀

