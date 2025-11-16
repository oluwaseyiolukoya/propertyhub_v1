# Quick Start: Stage-Based Progress System

## 🚀 Get Started in 5 Minutes

### **Step 1: Run Database Migration** (2 minutes)

```bash
cd backend
npx prisma generate
```

If you need to create the tables manually:
```bash
psql -U your_user -d contrezz -f backend/migrations/add_project_stages_system.sql
```

### **Step 2: Restart Backend** (1 minute)

```bash
# If using npm
npm run dev

# If using PM2
pm2 restart backend
```

### **Step 3: Test It!** (2 minutes)

1. Open your developer dashboard
2. Click on any project
3. Scroll down to see **"Project Stages"** section
4. Click **"Use Template"** button
5. Select a template (e.g., "Residential Construction")
6. Watch 11 stages appear! 🎉
7. Check the first stage
8. See progress jump to 5%! ✅

---

## 📋 Usage

### **Initialize Stages for a New Project**

1. Create a new project
2. In the project dashboard, find "Project Stages"
3. Click "Use Template"
4. Choose template based on project type:
   - **Residential** → Residential Construction
   - **Commercial** → Commercial Development
   - **Infrastructure** → Infrastructure Project
   - **Mixed-use** → Mixed-Use Development
5. Stages are created instantly!

### **Mark Stages as Complete**

1. Click the checkbox next to a stage
2. Progress updates automatically
3. Completion date is recorded
4. Uncheck to mark incomplete (reduces progress)

### **Add Custom Stages**

1. Click "Add Stage" button
2. Enter stage name (e.g., "Landscaping")
3. Set weight (how much it contributes to progress)
4. Mark as optional if needed
5. Click "Add Stage"

### **Edit or Delete Stages**

1. Click the edit icon (✏️) on any stage
2. Update name, description, or weight
3. Or click delete icon (🗑️) to remove

---

## 🎯 Example Workflow

**Project: Luxury Apartment Building**

```
Day 1: Initialize
✅ Choose "Residential Construction" template
→ 11 stages created, 0% progress

Week 2: Site Work
✅ Complete "Site Acquisition & Feasibility Study"
→ Progress: 5%

Month 1: Design
✅ Complete "Design & Planning"
→ Progress: 15%

Month 2: Permits
✅ Complete "Permits & Approvals"
→ Progress: 20%

Month 3: Foundation
✅ Complete "Site Preparation"
✅ Complete "Foundation Work"
→ Progress: 40%

Month 5: Structure
✅ Complete "Structural Framework"
→ Progress: 55%

Month 7: Exterior
✅ Complete "Exterior Walls & Roofing"
→ Progress: 65%

Month 9: MEP
✅ Complete "MEP Installation"
→ Progress: 77%

Month 11: Interior
✅ Complete "Interior Finishes"
→ Progress: 87%

Month 12: Handover
✅ Complete "Final Inspections & Handover"
→ Progress: 95%

Optional: Landscaping
✅ Complete "Landscaping & External Works"
→ Progress: 100% 🎉
```

---

## 💡 Pro Tips

### **Tip 1: Adjust Weights**
If a stage is more critical, give it more weight:
- Foundation: 15 (very important)
- Landscaping: 3 (less critical)

### **Tip 2: Use Optional Stages**
Mark stages as optional if they:
- Don't apply to all projects
- Are bonus features
- Can be skipped

### **Tip 3: Custom Stages**
Add project-specific stages:
- "Client Approval"
- "Material Procurement"
- "Quality Inspection"

### **Tip 4: Track Completion Dates**
Each completed stage shows when it was finished. Great for:
- Progress reports
- Timeline analysis
- Team performance

---

## 🎨 What You'll See

### **Progress Overview**
```
Overall Progress                    45%
████████████░░░░░░░░░░░░░░░░
4 of 10 stages completed • 6 remaining
```

### **Stage Checklist**
```
☑ 1. Foundation Work (Weight: 12)
    ✓ Completed on Jan 15, 2024

☑ 2. Structural Framework (Weight: 15)
    ✓ Completed on Feb 20, 2024

☐ 3. Exterior Walls & Roofing (Weight: 10)
    In progress...

☐ 4. MEP Installation (Weight: 12)
    Not started
```

---

## 🐛 Troubleshooting

### **Problem: Stages not showing**
**Solution:** 
- Check backend is running
- Verify migration completed
- Check browser console for errors

### **Problem: Progress not updating**
**Solution:**
- Refresh the page
- Check if stage has weight > 0
- Verify API is responding

### **Problem: Can't initialize template**
**Solution:**
- Delete existing stages first
- Check if project type matches template
- Try a different template

---

## 📊 API Quick Reference

```typescript
// Get stages
GET /api/developer-dashboard/projects/:projectId/stages

// Mark complete
POST /api/developer-dashboard/projects/:projectId/stages/:stageId/complete
Body: { userId: "user-123" }

// Initialize from template
POST /api/developer-dashboard/projects/:projectId/stages/initialize
Body: { templateType: "residential" }

// Add custom stage
POST /api/developer-dashboard/projects/:projectId/stages
Body: { 
  name: "Custom Stage",
  order: 1,
  weight: 10
}
```

---

## ✅ Success Checklist

- [ ] Database migration completed
- [ ] Backend restarted
- [ ] Can see "Project Stages" in dashboard
- [ ] Can initialize stages from template
- [ ] Can check/uncheck stages
- [ ] Progress updates when stages checked
- [ ] Can add custom stages
- [ ] Can edit/delete stages

---

## 🎉 You're Done!

Your stage-based progress system is now live! Start tracking your projects with simple, intuitive checklists.

**Need help?** Check `STAGE_BASED_PROGRESS_SYSTEM.md` for full documentation.

---

**Happy Building! 🏗️**

