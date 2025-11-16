# Stage-Based Project Progress System

## 🎯 Overview

The new stage-based progress system allows developers to track project progress by marking stages as completed. Progress is automatically calculated based on the weight of completed stages, providing a more intuitive and accurate way to measure project advancement.

---

## 📊 How It Works

### **Progress Calculation Formula:**

```
Progress = (Sum of Completed Stage Weights / Total Stage Weights) × 100
```

### **Key Features:**

1. **✅ User-Defined Stages** - Developers can create custom stages or use industry templates
2. **⚖️ Weighted Progress** - Each stage has a weight that determines its contribution to overall progress
3. **🎨 Optional Stages** - Mark stages as optional; they only count toward progress if completed
4. **📋 Industry Templates** - Pre-built stage templates for different project types
5. **🔄 Real-Time Updates** - Progress updates automatically when stages are marked complete/incomplete
6. **📱 Interactive UI** - Beautiful checklist interface with drag-and-drop reordering

---

## 🏗️ Industry-Standard Templates

### **1. Residential Construction** (11 stages)
```
1. Site Acquisition & Feasibility Study (5%)
2. Design & Planning (10%)
3. Permits & Approvals (5%)
4. Site Preparation (8%)
5. Foundation Work (12%)
6. Structural Framework (15%)
7. Exterior Walls & Roofing (10%)
8. MEP Installation (12%)
9. Interior Finishes (10%)
10. Final Inspections & Handover (8%)
11. Landscaping & External Works (5%) - Optional
```

### **2. Commercial Development** (11 stages)
```
1. Project Initiation & Feasibility (5%)
2. Design Development (10%)
3. Regulatory Approvals (8%)
4. Procurement & Contracting (5%)
5. Site Mobilization (5%)
6. Foundation & Substructure (12%)
7. Superstructure Construction (18%)
8. Building Envelope (10%)
9. MEP Systems Installation (12%)
10. Interior Fit-Out (10%)
11. Testing & Commissioning (5%)
```

### **3. Infrastructure Project** (8 stages)
```
1. Planning & Design (15%)
2. Environmental & Social Impact Assessment (8%)
3. Land Acquisition & Resettlement (10%)
4. Procurement (5%)
5. Site Preparation & Mobilization (8%)
6. Main Construction Works (35%)
7. Quality Assurance & Testing (10%)
8. Commissioning & Handover (9%)
```

### **4. Mixed-Use Development** (11 stages)
```
1. Concept & Feasibility (5%)
2. Master Planning (8%)
3. Detailed Design (10%)
4. Approvals & Permits (7%)
5. Phase 1: Foundation & Structure (15%)
6. Phase 2: Building Envelope (10%)
7. Phase 3: MEP Systems (12%)
8. Phase 4: Residential Fit-Out (10%)
9. Phase 5: Commercial Fit-Out (10%)
10. Common Areas & Amenities (8%)
11. Final Inspections & Handover (5%)
```

---

## 🚀 API Endpoints

### **1. Get Project Stages**
```http
GET /api/developer-dashboard/projects/:projectId/stages
```

**Response:**
```json
{
  "overallProgress": 45,
  "totalStages": 10,
  "completedStages": 4,
  "stages": [
    {
      "id": "stage-1",
      "projectId": "project-123",
      "name": "Foundation Work",
      "description": "Excavation, footings, and foundation construction",
      "order": 1,
      "weight": 12,
      "isCompleted": true,
      "completedAt": "2024-01-15T10:30:00Z",
      "completedBy": "user-456",
      "isOptional": false
    }
  ]
}
```

### **2. Create Stage**
```http
POST /api/developer-dashboard/projects/:projectId/stages
```

**Request Body:**
```json
{
  "name": "Foundation Work",
  "description": "Excavation and foundation construction",
  "order": 1,
  "weight": 12,
  "isOptional": false
}
```

### **3. Mark Stage as Completed**
```http
POST /api/developer-dashboard/projects/:projectId/stages/:stageId/complete
```

**Request Body:**
```json
{
  "userId": "user-456"
}
```

**Response:**
```json
{
  "stage": { /* updated stage */ },
  "projectProgress": 55,
  "completedStages": 5,
  "totalStages": 10
}
```

### **4. Mark Stage as Incomplete**
```http
POST /api/developer-dashboard/projects/:projectId/stages/:stageId/incomplete
```

### **5. Initialize from Template**
```http
POST /api/developer-dashboard/projects/:projectId/stages/initialize
```

**Request Body:**
```json
{
  "templateType": "residential"
}
```

### **6. Get Available Templates**
```http
GET /api/developer-dashboard/projects/stage-templates
```

### **7. Update Stage**
```http
PUT /api/developer-dashboard/projects/:projectId/stages/:stageId
```

### **8. Delete Stage**
```http
DELETE /api/developer-dashboard/projects/:projectId/stages/:stageId
```

### **9. Reorder Stages**
```http
POST /api/developer-dashboard/projects/:projectId/stages/reorder
```

**Request Body:**
```json
{
  "stageOrders": [
    { "stageId": "stage-1", "order": 1 },
    { "stageId": "stage-2", "order": 2 }
  ]
}
```

---

## 💻 Frontend Usage

### **Import the Component**
```typescript
import { ProjectStagesChecklist } from './components/ProjectStagesChecklist';
```

### **Use in Your Dashboard**
```tsx
<ProjectStagesChecklist
  projectId={projectId}
  userId={currentUserId}
  onProgressUpdate={(progress) => {
    console.log('New progress:', progress);
    // Update your UI
  }}
/>
```

---

## 📦 Database Schema

### **project_stages**
```prisma
model project_stages {
  id              String             @id @default(uuid())
  projectId       String
  name            String
  description     String?
  order           Int
  weight          Float              @default(1)
  isCompleted     Boolean            @default(false)
  completedAt     DateTime?
  completedBy     String?
  isOptional      Boolean            @default(false)
  notes           String?
  createdAt       DateTime           @default(now())
  updatedAt       DateTime           @updatedAt
  project         developer_projects @relation(fields: [projectId], references: [id], onDelete: Cascade)
}
```

### **project_stage_templates** (Optional - for storing custom templates)
```prisma
model project_stage_templates {
  id          String   @id @default(uuid())
  name        String   @unique
  description String?
  projectType String
  isDefault   Boolean  @default(false)
  isActive    Boolean  @default(true)
  stages      project_stage_template_items[]
}
```

---

## 🔄 Migration Steps

### **1. Run Database Migration**
```bash
cd backend
npx prisma migrate dev --name add_project_stages
npx prisma generate
```

### **2. Restart Backend**
```bash
npm run dev
# or
pm2 restart backend
```

### **3. Test the System**
1. Open a project in the developer dashboard
2. Click "Use Template" to initialize stages
3. Mark stages as completed
4. Watch progress update automatically!

---

## 🎨 UI Features

### **Stage Checklist Display**
- ✅ Checkbox to mark complete/incomplete
- 📊 Progress bar showing overall completion
- 🏷️ Badges for optional stages and weights
- 🗓️ Completion date display
- ✏️ Edit and delete buttons
- 🔢 Stage numbering and ordering

### **Template Selection**
- 📋 Browse industry-standard templates
- 👁️ Preview stages before applying
- 🚀 One-click initialization

### **Custom Stages**
- ➕ Add custom stages
- ⚖️ Set custom weights
- 📝 Add descriptions
- 🏷️ Mark as optional

---

## 📈 Benefits Over Old System

### **Old System (Multi-Factor Calculation)**
- ❌ Complex formula with 4 factors (Milestones 40%, Budget 30%, Time 20%, Stage 10%)
- ❌ Automatic but not intuitive
- ❌ Hard to understand why progress changed
- ❌ No clear action items

### **New System (Stage-Based)**
- ✅ Simple and intuitive
- ✅ Clear action items (complete stages)
- ✅ User has full control
- ✅ Industry-standard templates
- ✅ Flexible (custom stages + weights)
- ✅ Visual checklist interface
- ✅ Instant feedback

---

## 🔧 Customization

### **Adjust Stage Weights**
Weights determine how much each stage contributes to progress. For example:
- Critical stages (Foundation, Structure) → Higher weight (12-18)
- Minor stages (Planning, Permits) → Lower weight (5-8)

### **Optional Stages**
Mark stages as optional if they:
- Don't apply to all projects
- Are bonus/enhancement work
- Can be skipped without affecting core completion

Optional stages only count toward progress if completed.

---

## 🐛 Troubleshooting

### **Stages Not Loading**
- Check backend is running
- Verify project ID is correct
- Check browser console for errors

### **Progress Not Updating**
- Ensure stage weights are set correctly
- Check if stages are marked as optional
- Verify API endpoint is responding

### **Template Initialization Fails**
- Check if project already has stages (delete first)
- Verify project type matches template
- Check backend logs for errors

---

## 🎯 Example Workflow

1. **Create Project** → Project created with 0% progress
2. **Initialize Stages** → Choose "Residential Construction" template
3. **Start Work** → Begin with "Site Acquisition & Feasibility Study"
4. **Mark Complete** → Check off stage, progress updates to 5%
5. **Continue** → Complete "Design & Planning", progress → 15%
6. **Track Progress** → Watch progress bar grow as stages complete
7. **Finish** → Complete all stages, progress → 100%

---

## 📝 Notes

- Progress is capped at 100%
- Unchecking a stage reduces progress accordingly
- Deleting a stage recalculates progress
- Stage order can be changed via drag-and-drop (future feature)
- Stages are project-specific (not shared across projects)

---

## 🚀 Future Enhancements

- [ ] Drag-and-drop stage reordering
- [ ] Stage dependencies (can't complete B until A is done)
- [ ] Stage attachments (photos, documents)
- [ ] Stage comments/notes
- [ ] Stage duration tracking
- [ ] Stage assignment to team members
- [ ] Stage notifications
- [ ] Export stage checklist to PDF
- [ ] Stage templates management UI
- [ ] Bulk stage operations

---

## 📞 Support

If you encounter any issues or have questions:
1. Check the troubleshooting section above
2. Review backend logs: `pm2 logs backend`
3. Check browser console for frontend errors
4. Verify database migration completed successfully

---

**Happy Building! 🏗️**

