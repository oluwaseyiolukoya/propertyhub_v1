# Troubleshooting: Frontend Blank Page

## 🔍 Issue
The frontend is showing a blank page after adding the ProjectStagesChecklist component.

## ✅ Quick Fix Applied

I've temporarily **commented out** the ProjectStagesChecklist component to restore your frontend. The dashboard should now work again.

## 🛠️ Steps to Fix Properly

### **Step 1: Restart Frontend Dev Server**

```bash
# Kill any existing process on port 5173
lsof -ti:5173 | xargs kill -9

# Clear Vite cache
rm -rf node_modules/.vite

# Start fresh
npm run dev
```

### **Step 2: Check Browser Console**

1. Open your browser (Chrome/Firefox)
2. Press `F12` to open Developer Tools
3. Go to the **Console** tab
4. Look for any **red error messages**
5. Share the error message if you see one

### **Step 3: Check Terminal Output**

Look for errors in the terminal where `npm run dev` is running. Common errors:

```
❌ Module not found
❌ Cannot find module
❌ Unexpected token
❌ SyntaxError
```

## 🔧 Common Causes & Fixes

### **Cause 1: Missing Dependencies**

The ProjectStagesChecklist uses these UI components:
- `Checkbox`
- `Dialog`
- `Textarea`
- `Badge`
- `Progress`
- `Button`
- `Card`
- `Input`
- `Label`

**Fix:** Ensure all are installed:
```bash
# If using shadcn/ui
npx shadcn-ui@latest add checkbox
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add textarea
```

### **Cause 2: Import Path Issues**

Check if these imports work:
```typescript
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
```

**Fix:** Verify the `@/` alias is configured in `tsconfig.json`:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### **Cause 3: API Service Import**

The component imports from:
```typescript
import { getProjectStages, ... } from '../services/projectStages.service';
```

**Fix:** Verify the file exists at:
```
src/modules/developer-dashboard/services/projectStages.service.ts
```

### **Cause 4: Backend Not Running**

The component makes API calls to:
```
/api/developer-dashboard/projects/:projectId/stages
```

**Fix:** Ensure backend is running:
```bash
cd backend
npm run dev
# or
pm2 status backend
```

## 🎯 Enable the Component (After Fixing)

Once you've fixed the issues, uncomment the component:

### **File:** `src/modules/developer-dashboard/components/ProjectDashboard.tsx`

**Uncomment the import:**
```typescript
import { ProjectStagesChecklist } from './ProjectStagesChecklist';
```

**Uncomment the component:**
```tsx
<ProjectStagesChecklist
  projectId={projectId}
  userId={project.developerId}
  onProgressUpdate={(progress) => {
    if (data?.project) {
      data.project.progress = progress;
    }
  }}
/>
```

## 🧪 Test Step-by-Step

### **Test 1: Basic Import**
```typescript
// In ProjectDashboard.tsx
import { ProjectStagesChecklist } from './ProjectStagesChecklist';
console.log('Import successful!');
```

### **Test 2: Render Without Data**
```tsx
<div>
  <h2>Testing Stages Component</h2>
  {/* <ProjectStagesChecklist ... /> */}
</div>
```

### **Test 3: Render With Props**
```tsx
<ProjectStagesChecklist
  projectId={projectId}
  userId={project.developerId}
/>
```

### **Test 4: Full Integration**
```tsx
<ProjectStagesChecklist
  projectId={projectId}
  userId={project.developerId}
  onProgressUpdate={(progress) => {
    console.log('Progress updated:', progress);
  }}
/>
```

## 📋 Debugging Checklist

- [ ] Frontend dev server is running (`npm run dev`)
- [ ] Backend server is running
- [ ] No errors in browser console
- [ ] No errors in terminal
- [ ] All UI components exist in `src/components/ui/`
- [ ] `projectStages.service.ts` exists
- [ ] `ProjectStagesChecklist.tsx` exists
- [ ] Database migration completed
- [ ] Backend route registered in `index.ts`

## 🔍 Get More Info

### **Check if component file is valid:**
```bash
npx tsc --noEmit src/modules/developer-dashboard/components/ProjectStagesChecklist.tsx
```

### **Check if service file is valid:**
```bash
npx tsc --noEmit src/modules/developer-dashboard/services/projectStages.service.ts
```

### **Check Vite config:**
```bash
cat vite.config.ts
```

## 🆘 Still Having Issues?

### **Option 1: Use the Component Later**

Keep it commented out for now. You can:
1. Fix other issues first
2. Test the backend API directly
3. Enable the component when ready

### **Option 2: Simplify the Component**

Create a minimal version first:

```tsx
// Minimal test version
export const ProjectStagesChecklist = ({ projectId }: { projectId: string }) => {
  return (
    <div className="p-4 border rounded">
      <h3>Project Stages (Test)</h3>
      <p>Project ID: {projectId}</p>
    </div>
  );
};
```

### **Option 3: Check Browser Network Tab**

1. Open DevTools → Network tab
2. Reload page
3. Look for failed requests (red)
4. Check if API calls are being made

## 📝 Report the Issue

If you need help, provide:

1. **Browser Console Errors** (screenshot or copy)
2. **Terminal Output** (where `npm run dev` is running)
3. **Network Tab** (any failed requests)
4. **Node Version** (`node --version`)
5. **NPM Version** (`npm --version`)

## ✅ Current Status

**Status:** Component temporarily disabled
**Dashboard:** Should be working normally
**Next Step:** Follow the steps above to debug and re-enable

---

## 🎯 Quick Commands

```bash
# Restart everything fresh
pkill -f vite
pkill -f node
cd /path/to/project
rm -rf node_modules/.vite
npm run dev

# Check what's running
lsof -i :5173  # Frontend
lsof -i :5000  # Backend

# View logs
tail -f /var/log/frontend.log
pm2 logs backend
```

---

**The dashboard should work now with the component commented out. Follow the steps above to debug and re-enable it!** 🚀

