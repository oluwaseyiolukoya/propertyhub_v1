# Landing Page Forms - Quick Start Guide

## 🚀 Implementation Steps

### Step 1: Run Database Migration

```bash
# Navigate to backend directory
cd backend

# Run Prisma migration
npx prisma migrate dev --name add_landing_page_submissions

# Generate Prisma client
npx prisma generate
```

### Step 2: Create Backend Service

File: `backend/src/services/landing-forms.service.ts`

Already created with core functionality:
- Submit form
- Get all submissions with filters
- Get single submission
- Update submission
- Add response
- Assign to admin
- Get statistics
- Export to CSV

### Step 3: Create Backend Routes

File: `backend/src/routes/landing-forms.ts`

Endpoints created:
- `POST /api/landing-forms/submit` - Public submission endpoint
- `GET /api/admin/landing-forms` - List all submissions (admin only)
- `GET /api/admin/landing-forms/:id` - Get single submission
- `PATCH /api/admin/landing-forms/:id` - Update submission
- `POST /api/admin/landing-forms/:id/respond` - Add response
- `POST /api/admin/landing-forms/:id/assign` - Assign to admin
- `GET /api/admin/landing-forms/stats` - Get statistics
- `GET /api/admin/landing-forms/export` - Export to CSV

### Step 4: Register Routes in Main App

Add to `backend/src/index.ts`:

```typescript
import landingFormsRoutes from './routes/landing-forms';

// Register routes
app.use('/api/landing-forms', landingFormsRoutes);
```

### Step 5: Create Frontend API Client

File: `src/lib/api/landing-forms.ts`

```typescript
import { apiClient } from '../api-client';

export interface SubmissionData {
  formType: 'contact_us' | 'schedule_demo' | 'blog_inquiry' | 'community_request' | 'partnership' | 'support';
  name: string;
  email: string;
  phone?: string;
  company?: string;
  subject?: string;
  message: string;
  preferredDate?: string;
  preferredTime?: string;
  timezone?: string;
  source?: string;
}

export const landingFormsAPI = {
  // Public endpoints
  submit: (data: SubmissionData) => 
    apiClient.post('/landing-forms/submit', data),
  
  // Admin endpoints
  getAll: (filters?: any) => 
    apiClient.get('/admin/landing-forms', { params: filters }),
  
  getById: (id: string) => 
    apiClient.get(`/admin/landing-forms/${id}`),
  
  update: (id: string, data: any) => 
    apiClient.patch(`/admin/landing-forms/${id}`, data),
  
  respond: (id: string, response: any) => 
    apiClient.post(`/admin/landing-forms/${id}/respond`, response),
  
  assign: (id: string, adminId: string) => 
    apiClient.post(`/admin/landing-forms/${id}/assign`, { adminId }),
  
  getStats: () => 
    apiClient.get('/admin/landing-forms/stats'),
  
  export: (filters?: any) => 
    apiClient.get('/admin/landing-forms/export', { 
      params: filters, 
      responseType: 'blob' 
    }),
};
```

### Step 6: Update Contact Form (Example)

```typescript
// In your ContactPage.tsx or ScheduleDemoPage.tsx
import { landingFormsAPI } from '../lib/api/landing-forms';
import { toast } from 'sonner';

const handleSubmit = async (formData) => {
  try {
    const result = await landingFormsAPI.submit({
      formType: 'contact_us',
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      company: formData.company,
      subject: formData.subject,
      message: formData.message,
      source: 'contact_page',
    });
    
    toast.success('Message sent successfully! We\'ll respond within 24 hours.');
    // Reset form or redirect
  } catch (error) {
    toast.error('Failed to send message. Please try again.');
  }
};
```

### Step 7: Create Admin Dashboard Component

File: `src/components/admin/LandingFormsManagement.tsx`

Key features:
- Data table with submissions
- Filters (type, status, priority, date range)
- Search functionality
- Detail modal
- Status updates
- Response tracking
- Assignment system
- Export functionality

### Step 8: Add to Admin Dashboard Navigation

In your Admin Dashboard, add a new menu item:

```typescript
{
  label: 'Landing Forms',
  icon: <MessageSquare className="h-5 w-5" />,
  path: '/admin/landing-forms',
  component: <LandingFormsManagement />
}
```

---

## 📋 Testing

### Test Submission
```bash
curl -X POST http://localhost:5000/api/landing-forms/submit \
  -H "Content-Type: application/json" \
  -d '{
    "formType": "contact_us",
    "name": "Test User",
    "email": "test@example.com",
    "phone": "+1234567890",
    "company": "Test Corp",
    "subject": "Testing",
    "message": "This is a test submission",
    "source": "test"
  }'
```

### View Submissions (Admin)
```bash
curl -X GET http://localhost:5000/api/admin/landing-forms \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

---

## 🎨 UI Component Examples

### Simple Contact Form Integration
```typescript
<form onSubmit={handleSubmit}>
  <Input name="name" placeholder="Your Name" required />
  <Input name="email" type="email" placeholder="Email" required />
  <Input name="phone" placeholder="Phone (optional)" />
  <Textarea name="message" placeholder="Your message" required />
  <Button type="submit">Send Message</Button>
</form>
```

### Admin Table View
```typescript
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Type</TableHead>
      <TableHead>Name</TableHead>
      <TableHead>Email</TableHead>
      <TableHead>Status</TableHead>
      <TableHead>Date</TableHead>
      <TableHead>Actions</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {submissions.map((sub) => (
      <TableRow key={sub.id}>
        <TableCell>{formatFormType(sub.formType)}</TableCell>
        <TableCell>{sub.name}</TableCell>
        <TableCell>{sub.email}</TableCell>
        <TableCell>
          <Badge variant={getStatusVariant(sub.status)}>
            {sub.status}
          </Badge>
        </TableCell>
        <TableCell>{formatDate(sub.createdAt)}</TableCell>
        <TableCell>
          <Button size="sm" onClick={() => viewDetails(sub.id)}>
            View
          </Button>
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

---

## 🔧 Configuration Options

### Email Notifications (Optional)
Add to your email service to notify admins of new submissions:

```typescript
// In landing-forms.service.ts
async notifyAdmins(submission: any) {
  await sendEmail({
    to: 'admin@yourcompany.com',
    subject: `New ${submission.formType} submission`,
    body: `
      Name: ${submission.name}
      Email: ${submission.email}
      Message: ${submission.message}
      
      View: https://yourapp.com/admin/landing-forms/${submission.id}
    `
  });
}
```

### Rate Limiting
Already implemented in the service (5 submissions per IP per day)

### Spam Detection
Basic spam detection included. Enhance with:
- Honeypot fields
- Google reCAPTCHA
- Email validation services
- IP reputation checks

---

## 📊 Analytics & Reports

### Dashboard Metrics
- Total submissions by type
- Response time averages
- Conversion rates (demos scheduled vs requested)
- Status distribution
- Trending topics from messages

### Export Options
- CSV export with all data
- Filtered exports
- Date range exports
- Excel format (requires additional library)

---

## 🔐 Security Checklist

✅ Rate limiting implemented (5/day per IP)
✅ Input validation with Zod
✅ SQL injection protection (Prisma)
✅ XSS protection (sanitized inputs)
✅ Admin-only endpoints protected
✅ Soft delete for data retention
✅ Audit logging capability
✅ GDPR-ready (data export/delete)

---

## 🚀 Next Steps

1. Run the migration
2. Test submission endpoints
3. Build admin UI components
4. Integrate with existing forms
5. Set up email notifications
6. Configure monitoring/alerts
7. Train team on new system

---

## 💡 Pro Tips

- Use the `customFields` JSON column for form-specific data
- Leverage `internalTags` for custom categorization
- Set up Slack/Discord webhooks for instant notifications
- Create saved filters for common queries
- Use bulk actions for efficiency
- Schedule regular exports for backup
- Monitor response time SLAs

---

## 📞 Support

For questions or issues with implementation, check:
- Full architecture doc: `LANDING_PAGE_FORMS_ARCHITECTURE.md`
- Database migration: `backend/migrations/add_landing_page_submissions.sql`
- Service implementation: `backend/src/services/landing-forms.service.ts`

