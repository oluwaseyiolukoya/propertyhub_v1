# Landing Page Forms Management - Architecture Design

## Overview

A centralized system for managing all landing page form submissions (Contact Us, Schedule Demo, Blog Inquiries, Community Requests, etc.) with admin dashboard controls.

---

## 1. Database Schema Design

### Primary Table: `landing_page_submissions`

```prisma
model landing_page_submissions {
  id              String   @id @default(uuid())

  // Submission Type
  formType        String   // 'contact_us' | 'schedule_demo' | 'blog_inquiry' | 'community_request' | 'partnership' | 'support'

  // Contact Information
  name            String
  email           String
  phone           String?
  company         String?
  jobTitle        String?

  // Submission Details
  subject         String?
  message         String   @db.Text
  preferredDate   DateTime?
  preferredTime   String?
  timezone        String?

  // Metadata
  status          String   @default("new")  // 'new' | 'contacted' | 'in_progress' | 'resolved' | 'closed' | 'spam'
  priority        String   @default("normal") // 'low' | 'normal' | 'high' | 'urgent'
  source          String?  // 'landing_page' | 'blog' | 'pricing_page' | etc.
  referralUrl     String?
  utmSource       String?
  utmMedium       String?
  utmCampaign     String?

  // Admin Management
  assignedToId    String?
  assignedTo      users?   @relation("assigned_submissions", fields: [assignedToId], references: [id])
  adminNotes      String?  @db.Text
  internalTags    String[] // For categorization and filtering

  // Response Tracking
  responseStatus  String?  // 'pending' | 'replied' | 'scheduled' | 'completed'
  responseDate    DateTime?
  responseBy      String?
  responseNotes   String?  @db.Text

  // Technical Details
  ipAddress       String?
  userAgent       String?
  browserInfo     Json?
  deviceInfo      Json?

  // Custom Fields (flexible JSON for form-specific data)
  customFields    Json?

  // Timestamps
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  contactedAt     DateTime?
  resolvedAt      DateTime?

  // Relations
  responder       users?   @relation("responded_submissions", fields: [responseBy], references: [id])

  @@index([formType])
  @@index([status])
  @@index([priority])
  @@index([email])
  @@index([createdAt])
  @@index([assignedToId])
  @@index([responseStatus])
}
```

### Supporting Table: `submission_responses`

```prisma
model submission_responses {
  id                String   @id @default(uuid())
  submissionId      String

  // Response Details
  responseType      String   // 'email' | 'phone' | 'meeting' | 'internal_note'
  content           String   @db.Text

  // Metadata
  respondedById     String
  respondedBy       users    @relation(fields: [respondedById], references: [id])

  // Attachments
  attachments       Json?    // Array of file URLs

  // Timestamps
  createdAt         DateTime @default(now())

  @@index([submissionId])
  @@index([respondedById])
  @@index([createdAt])
}
```

---

## 2. Backend API Design

### Base Route: `/api/admin/landing-forms`

#### Public Endpoints (No Auth Required)

```typescript
POST   /api/landing-forms/submit
  - Submit any landing page form
  - Rate limited (5 per day per IP)
  - Body: { formType, name, email, phone?, company?, message, ... }

GET    /api/landing-forms/status/:id
  - Check submission status (by ID or tracking code)
```

#### Admin Endpoints (Auth Required)

```typescript
GET    /api/admin/landing-forms
  - List all submissions with filters
  - Query params: formType, status, priority, dateRange, search, page, limit

GET    /api/admin/landing-forms/:id
  - Get single submission with full details and response history

PATCH  /api/admin/landing-forms/:id
  - Update submission (status, priority, notes, assignment)

DELETE /api/admin/landing-forms/:id
  - Soft delete submission (mark as deleted)

POST   /api/admin/landing-forms/:id/respond
  - Add a response to submission

POST   /api/admin/landing-forms/:id/assign
  - Assign submission to admin user

GET    /api/admin/landing-forms/stats
  - Get analytics (total, by type, by status, response time, etc.)

POST   /api/admin/landing-forms/bulk-action
  - Bulk operations (mark as read, assign, change status, export)

GET    /api/admin/landing-forms/export
  - Export submissions as CSV/Excel
```

---

## 3. Frontend Admin Component Structure

### Main Component: `LandingFormsManagementPage`

```
src/components/admin/
├── LandingFormsManagementPage.tsx       # Main container
├── landing-forms/
│   ├── SubmissionsTable.tsx            # Data table with filters
│   ├── SubmissionDetailModal.tsx       # View/edit single submission
│   ├── SubmissionFilters.tsx           # Filter sidebar
│   ├── SubmissionStats.tsx             # Analytics cards
│   ├── ResponseForm.tsx                # Add response to submission
│   ├── BulkActionsMenu.tsx             # Bulk operations
│   ├── ExportDialog.tsx                # Export options
│   └── AssignmentSelector.tsx          # Assign to admin users
```

### Key Features for Admin UI:

#### Dashboard View

```
┌─────────────────────────────────────────────────────────┐
│  Landing Page Submissions Management                    │
├─────────────────────────────────────────────────────────┤
│  [Stats Cards]                                          │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐          │
│  │ Total  │ │  New   │ │Pending │ │Resolved│          │
│  │  245   │ │   12   │ │   18   │ │  215   │          │
│  └────────┘ └────────┘ └────────┘ └────────┘          │
├─────────────────────────────────────────────────────────┤
│  Filters: [Form Type ▼] [Status ▼] [Priority ▼]       │
│           [Date Range] [Search...] [Export]            │
├─────────────────────────────────────────────────────────┤
│  [Bulk Actions ▼] Selected: 0                          │
├─────────────────────────────────────────────────────────┤
│  Table:                                                 │
│  ┌──┬────────┬──────────┬──────────┬────────┬─────┐   │
│  │☐ │ Type   │ Name     │ Email    │ Status │ Date│   │
│  ├──┼────────┼──────────┼──────────┼────────┼─────┤   │
│  │☐ │Contact │John Doe  │john@...  │New🔴   │Today│   │
│  │☐ │Demo    │Jane Smith│jane@...  │Replied │2d ago│  │
│  └──┴────────┴──────────┴──────────┴────────┴─────┘   │
└─────────────────────────────────────────────────────────┘
```

#### Submission Detail Modal

```
┌─────────────────────────────────────────────────┐
│  Submission Details                    [X]      │
├─────────────────────────────────────────────────┤
│  Type: Schedule Demo    Status: [New ▼]        │
│  Priority: [Normal ▼]   Assigned: [Select ▼]   │
├─────────────────────────────────────────────────┤
│  Contact Info:                                  │
│  Name:    John Doe                              │
│  Email:   john@example.com                      │
│  Phone:   +1234567890                           │
│  Company: Acme Corp                             │
├─────────────────────────────────────────────────┤
│  Message:                                       │
│  "I'd like to schedule a demo..."               │
├─────────────────────────────────────────────────┤
│  Preferred: Jan 15, 2025, 10:00 AM (EST)       │
│  Source: Landing Page                           │
│  IP: 192.168.1.1                                │
├─────────────────────────────────────────────────┤
│  Admin Notes:                                   │
│  [Text area for internal notes...]             │
├─────────────────────────────────────────────────┤
│  Response History:                              │
│  └─ Jan 10 - Email sent by Sarah (Admin)       │
│  └─ Jan 12 - Meeting scheduled                 │
├─────────────────────────────────────────────────┤
│  [Add Response] [Save] [Mark Resolved]          │
└─────────────────────────────────────────────────┘
```

---

## 4. Service Layer Design

### Backend Service: `landing-forms.service.ts`

```typescript
export class LandingFormsService {
  // Public methods
  async submitForm(data: SubmissionData): Promise<Submission>;
  async getSubmissionStatus(id: string): Promise<SubmissionStatus>;

  // Admin methods
  async getSubmissions(filters: FilterOptions): Promise<PaginatedSubmissions>;
  async getSubmissionById(id: string): Promise<SubmissionDetail>;
  async updateSubmission(id: string, updates: UpdateData): Promise<Submission>;
  async deleteSubmission(id: string): Promise<void>;
  async addResponse(id: string, response: ResponseData): Promise<Response>;
  async assignSubmission(id: string, adminId: string): Promise<Submission>;
  async getStatistics(dateRange?: DateRange): Promise<Statistics>;
  async bulkAction(ids: string[], action: BulkAction): Promise<BulkResult>;
  async exportSubmissions(
    filters: FilterOptions,
    format: "csv" | "excel"
  ): Promise<Buffer>;

  // Utility methods
  async sendNotificationToAdmin(submissionId: string): Promise<void>;
  async sendAutoReply(submissionId: string): Promise<void>;
  async detectSpam(submission: SubmissionData): Promise<boolean>;
}
```

### Frontend API Client: `landing-forms.ts`

```typescript
export const landingFormsAPI = {
  // Public
  submit: (data: SubmissionData) =>
    apiClient.post("/landing-forms/submit", data),
  checkStatus: (id: string) => apiClient.get(`/landing-forms/status/${id}`),

  // Admin
  getAll: (filters: FilterOptions) =>
    apiClient.get("/admin/landing-forms", { params: filters }),
  getById: (id: string) => apiClient.get(`/admin/landing-forms/${id}`),
  update: (id: string, data: UpdateData) =>
    apiClient.patch(`/admin/landing-forms/${id}`, data),
  delete: (id: string) => apiClient.delete(`/admin/landing-forms/${id}`),
  respond: (id: string, response: ResponseData) =>
    apiClient.post(`/admin/landing-forms/${id}/respond`, response),
  assign: (id: string, adminId: string) =>
    apiClient.post(`/admin/landing-forms/${id}/assign`, { adminId }),
  getStats: () => apiClient.get("/admin/landing-forms/stats"),
  bulkAction: (ids: string[], action: string) =>
    apiClient.post("/admin/landing-forms/bulk-action", { ids, action }),
  export: (filters: FilterOptions) =>
    apiClient.get("/admin/landing-forms/export", {
      params: filters,
      responseType: "blob",
    }),
};
```

---

## 5. Features & Functionality

### Core Features

✅ **Multi-form Support**: Contact, Demo, Blog, Community, Partnership
✅ **Status Management**: New → Contacted → In Progress → Resolved
✅ **Priority Levels**: Low, Normal, High, Urgent
✅ **Assignment System**: Assign to specific admin users
✅ **Response Tracking**: Track all responses and follow-ups
✅ **Admin Notes**: Internal notes not visible to submitters
✅ **Spam Detection**: Basic spam filtering
✅ **Rate Limiting**: Prevent abuse
✅ **Email Notifications**: Auto-notify admins on new submissions

### Advanced Features

🚀 **Search & Filter**: By type, status, date, priority, email, etc.
🚀 **Bulk Actions**: Mark multiple as read, assign, export
🚀 **Analytics Dashboard**: Submission trends, response times, conversion rates
🚀 **Export**: CSV/Excel export with filters
🚀 **Auto-responses**: Send automatic confirmation emails
🚀 **SLA Tracking**: Track response time SLAs
🚀 **Tags System**: Custom tags for categorization
🚀 **Activity Log**: Track all actions on submissions

### Integration Points

🔗 **Email Integration**: Send responses via email
🔗 **Calendar Integration**: Schedule demos directly
🔗 **CRM Integration**: Sync with external CRM (future)
🔗 **Slack/Discord**: Notify team on new submissions
🔗 **Analytics**: Track form performance

---

## 6. Security Considerations

### Public Endpoints

- Rate limiting (5 submissions per IP per day)
- CAPTCHA/honeypot for spam prevention
- Input sanitization and validation
- XSS protection
- CSRF tokens

### Admin Endpoints

- JWT authentication required
- Role-based access control (only admins)
- Audit logging for all actions
- PII data encryption at rest
- Secure export with access controls

---

## 7. Implementation Phases

### Phase 1: Foundation (Week 1-2)

- ✅ Database schema migration
- ✅ Backend API endpoints
- ✅ Basic service layer
- ✅ Public submission endpoints

### Phase 2: Admin Dashboard (Week 2-3)

- ✅ Admin UI components
- ✅ Table with filters
- ✅ Detail modal
- ✅ Basic CRUD operations

### Phase 3: Advanced Features (Week 3-4)

- ✅ Response system
- ✅ Assignment workflow
- ✅ Bulk actions
- ✅ Analytics dashboard

### Phase 4: Polish & Integration (Week 4-5)

- ✅ Email notifications
- ✅ Export functionality
- ✅ Auto-responses
- ✅ Testing & optimization

---

## 8. Example Usage

### Submitting a Contact Form (Frontend)

```typescript
const handleContactSubmit = async (formData) => {
  try {
    const result = await landingFormsAPI.submit({
      formType: "contact_us",
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      company: formData.company,
      subject: formData.subject,
      message: formData.message,
      source: "contact_page",
    });

    toast.success("Message sent successfully! We'll respond within 24 hours.");
  } catch (error) {
    toast.error("Failed to send message. Please try again.");
  }
};
```

### Admin Viewing Submissions

```typescript
const AdminLandingForms = () => {
  const [submissions, setSubmissions] = useState([]);
  const [filters, setFilters] = useState({
    formType: "all",
    status: "new",
    page: 1,
    limit: 20,
  });

  useEffect(() => {
    loadSubmissions();
  }, [filters]);

  const loadSubmissions = async () => {
    const result = await landingFormsAPI.getAll(filters);
    setSubmissions(result.data.submissions);
  };

  // ... render table and modals
};
```

---

## 9. Metrics to Track

- **Volume**: Submissions per day/week/month
- **Response Time**: Average time to first response
- **Resolution Time**: Average time to resolution
- **Conversion Rate**: Demos scheduled / demo requests
- **Form Performance**: Completion rate per form type
- **Admin Performance**: Submissions handled per admin
- **Customer Satisfaction**: Follow-up satisfaction scores

---

## 10. Future Enhancements

- AI-powered response suggestions
- Automated categorization using ML
- Integration with marketing automation tools
- Multi-language support
- Advanced reporting and dashboards
- Mobile app for admins
- Real-time collaboration on submissions
- Customer portal for tracking submissions

---

## Summary

This architecture provides:
✅ Scalable database schema for all form types
✅ Secure and rate-limited public APIs
✅ Comprehensive admin management interface
✅ Flexible filtering and search capabilities
✅ Response tracking and workflow management
✅ Analytics and reporting
✅ Integration-ready design
✅ Security best practices
✅ Clear implementation roadmap

The system is designed to grow with your needs while maintaining performance and user experience.
