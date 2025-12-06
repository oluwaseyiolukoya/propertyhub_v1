# 🧪 Report Scheduling - Test Checklist

**Status:** ✅ Ready to Test  
**Date:** December 6, 2025

---

## ✅ Confirmed Integration

### Backend

- ✅ Database migration applied
- ✅ Routes registered at `/api/report-schedules`
- ✅ Email service configured

### Frontend

- ✅ `ReportsTabContent` component created
- ✅ `ScheduledReportsList` component created
- ✅ `useReportSchedules` hook created
- ✅ API service created
- ✅ Integrated into PropertiesPage.tsx

---

## 🚀 Testing Steps

### 1. Start the Application

**Terminal 1 - Backend:**

```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**

```bash
npm run dev
```

**Expected:** Both services start without errors

---

### 2. Login & Navigate

1. Open browser: `http://localhost:5173`
2. Login as a **Property Owner**
3. Navigate to **Properties** page
4. Click on **Reports** tab

**Expected:**

- Reports tab loads without errors
- See analytics header (purple gradient)
- See 4 report category cards
- See "No Scheduled Reports" message (if first time)

---

### 3. Generate a Report

1. Stay on Reports tab
2. Look for report generation section (if available)
3. Or use existing report preview from other tabs

**Expected:**

- Schedule form appears when report is available

---

### 4. Schedule a Report

1. **Enter your email** in the email field
2. **Select frequency:** Weekly or Monthly
3. **Choose day:**
   - Weekly: Select day of week (e.g., Monday)
   - Monthly: Select day of month (e.g., 1)
4. **Set time:** e.g., 09:00
5. Click **"Schedule Report"** button

**Expected:**

- ✅ Loading spinner appears
- ✅ Success toast: "Report scheduled! Will be sent to your@email.com"
- ✅ Schedule appears in the list below
- ✅ Shows schedule details (name, email, frequency, next run)

---

### 5. Test Email Feature ⭐ (MAIN FEATURE)

1. Find your schedule in the list
2. Click the **"Test Email"** button (with Send icon 📧)

**Expected:**

- ✅ Loading spinner on button
- ✅ Toast: "Sending test email..."
- ✅ Success toast: "Test email sent to your@email.com! Check your inbox."
- ✅ **Check your email inbox** - you should receive an email with:
  - Subject: "Scheduled [Report Type] Report - [Property]"
  - Body with report details
  - Schedule information
  - Professional formatting

---

### 6. Test Pause/Resume

1. Click the **Pause button** (⏸️ icon) on a schedule

**Expected:**

- ✅ Status badge changes to "paused"
- ✅ Toast: "Schedule paused"

2. Click the **Play button** (▶️ icon)

**Expected:**

- ✅ Status badge changes to "active"
- ✅ Toast: "Schedule activated"

---

### 7. Test Delete

1. Click the **Delete button** (🗑️ icon) on a schedule
2. Confirm deletion in dialog

**Expected:**

- ✅ Confirmation dialog appears
- ✅ Schedule removed from list
- ✅ Toast: "Schedule deleted successfully"

---

### 8. Test Persistence

1. Refresh the page (F5)
2. Navigate back to Reports tab

**Expected:**

- ✅ All schedules still appear
- ✅ Status badges correct
- ✅ Data persisted in database

---

## 🐛 Troubleshooting

### Issue: "Module not found" errors

**Check these files exist:**

```bash
ls -la src/components/reports/ReportsTabContent.tsx
ls -la src/components/reports/ScheduledReportsList.tsx
ls -la src/hooks/useReportSchedules.ts
ls -la src/services/reportSchedules.api.ts
```

**Fix:** Make sure all files are created in correct locations

---

### Issue: Backend errors

**Check backend console for errors:**

- Database connection issues?
- Migration not applied?

**Run:**

```bash
cd backend
npx prisma migrate status
npx prisma generate
```

---

### Issue: Email not sending

**Check backend `.env` file:**

```env
SMTP_HOST=mail.privateemail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your-email@domain.com
SMTP_PASS=your-password
SMTP_FROM=your-email@domain.com
```

**Test SMTP manually:**

```bash
cd backend
node -e "
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});
transporter.verify().then(() => console.log('✅ SMTP OK')).catch(console.error);
"
```

---

### Issue: "Cannot read property" errors

**Check PropertiesPage.tsx has all required state:**

- `scheduleEmail`
- `scheduleFrequency`
- `scheduleDayOfWeek`
- `scheduleDayOfMonth`
- `scheduleTime`

**These should be defined as useState hooks**

---

### Issue: UI not updating after actions

**Check:**

1. `refresh()` is called after create/update/delete
2. `useReportSchedules` hook is working
3. API responses are successful

**Debug:**

- Open browser DevTools → Network tab
- Watch API calls to `/api/report-schedules`
- Check response status and data

---

## ✅ Success Criteria

Mark each when completed:

- [ ] Backend starts without errors
- [ ] Frontend compiles without errors
- [ ] Can navigate to Reports tab
- [ ] Can see analytics header and cards
- [ ] Can schedule a report
- [ ] Schedule appears in list
- [ ] **Can click "Test Email" button**
- [ ] **Receives email in inbox**
- [ ] Email contains report details
- [ ] Can pause a schedule
- [ ] Can resume a schedule
- [ ] Can delete a schedule
- [ ] Changes persist after refresh
- [ ] No console errors
- [ ] All UI elements responsive

---

## 📊 Test Results Template

Copy this and fill in your results:

```
## Test Results - [Date]

### Environment
- Backend: Running on port ____
- Frontend: Running on port ____
- Browser: ____________
- User: ____________

### Test Results

1. ✅/❌ Application starts
2. ✅/❌ Navigate to Reports tab
3. ✅/❌ Schedule report created
4. ✅/❌ Test email sent
5. ✅/❌ Email received
6. ✅/❌ Pause/Resume works
7. ✅/❌ Delete works
8. ✅/❌ Data persists

### Email Details
- From: ____________
- To: ____________
- Subject: ____________
- Received: ✅/❌
- Time taken: ____ seconds

### Issues Found
1. [List any issues]

### Notes
[Any additional observations]
```

---

## 🎉 When All Tests Pass

Congratulations! Your report scheduling feature is fully functional:

- ✅ Users can schedule automated reports
- ✅ **Users can test email delivery immediately**
- ✅ Users can manage their schedules
- ✅ All data persists correctly
- ✅ Professional UI/UX

### Next Steps (Optional)

1. **Add Cron Job:** Auto-send reports at scheduled times
2. **Email Templates:** Rich HTML with charts
3. **Report History:** Track all sent reports
4. **Multiple Recipients:** CC multiple emails
5. **PDF Attachments:** Attach generated PDFs

---

## 📞 Need Help?

If you encounter issues:

1. Check the troubleshooting section above
2. Review `INTEGRATION_GUIDE.md`
3. Check `docs/REPORT_SCHEDULING_IMPLEMENTATION_STATUS.md`
4. Review component code for inline comments

---

**Happy Testing! 🚀📧**
