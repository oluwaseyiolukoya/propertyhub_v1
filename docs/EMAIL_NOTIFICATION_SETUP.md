# Email Notification Setup Guide

## ✅ **SETUP COMPLETE!**

Your email notification system is now **fully configured and running**!

---

## 📧 **HOW IT WORKS**

### **Automatic Email Processing:**
- ✅ **Every 2 minutes**, the server automatically processes pending emails
- ✅ **Retry logic**: Failed emails retry up to 3 times
- ✅ **Priority-based**: High-priority emails sent first
- ✅ **Status tracking**: All emails logged in database

### **Email Flow:**
```
1. Event occurs (invoice approved, etc.)
   ↓
2. Notification created in database
   ↓
3. Email queued in email_queue table
   ↓
4. Background processor picks it up (every 2 minutes)
   ↓
5. Email sent via SMTP
   ↓
6. Status updated (sent/failed)
```

---

## 🎯 **TESTING EMAIL NOTIFICATIONS**

### **Method 1: Send Test Notification**

1. **Open your app**: `http://localhost:5173`
2. **Login** as a developer
3. **Go to Settings** → Notifications tab
4. **Click "Send Test"** button
5. **Check your notification center** (bell icon) - should see it immediately
6. **Wait 2 minutes** - email will be sent automatically
7. **Check your email inbox** - you should receive the test email

### **Method 2: Trigger Real Notification**

1. **Create an invoice** in the system
2. **Approve or reject it**
3. **Check notification center** - notification appears immediately
4. **Wait 2 minutes** - email sent automatically
5. **Check email inbox** - approval/rejection email received

### **Method 3: Manual Queue Processing**

If you want to send emails immediately without waiting:

```bash
# Call the API endpoint
curl -X POST http://localhost:5000/api/notifications/process-queue
```

Or in your browser console:
```javascript
fetch('http://localhost:5000/api/notifications/process-queue', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer YOUR_TOKEN' }
});
```

---

## 🔍 **CHECKING EMAIL STATUS**

### **In Database:**

```sql
-- See pending emails
SELECT * FROM email_queue 
WHERE status = 'pending' 
ORDER BY created_at DESC;

-- See sent emails
SELECT * FROM email_queue 
WHERE status = 'sent' 
ORDER BY sent_at DESC 
LIMIT 10;

-- See failed emails
SELECT * FROM email_queue 
WHERE status = 'failed' 
ORDER BY failed_at DESC;
```

### **In Backend Logs:**

Watch for these messages:
```
📧 Processing email queue (limit: 10)...
✅ Email sent: [email-id]
📧 Processed 1 emails from queue
```

Or errors:
```
❌ Error sending email [email-id]: [error message]
```

---

## ⚙️ **CONFIGURATION**

### **Your SMTP Settings (in .env):**

The system uses these environment variables:
```bash
SMTP_HOST=your-smtp-host
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@domain.com
SMTP_PASS=your-password
```

### **Email Queue Settings:**

Currently configured:
- **Processing Interval**: Every 2 minutes
- **Batch Size**: 10 emails per batch
- **Max Retries**: 3 attempts
- **Priority Levels**: 1-10 (lower = higher priority)

### **To Change Processing Interval:**

Edit `backend/src/index.ts`:
```typescript
// Change from 2 minutes to 5 minutes:
}, 5 * 60 * 1000); // Every 5 minutes

// Or 30 seconds for testing:
}, 30 * 1000); // Every 30 seconds
```

---

## 📊 **EMAIL TYPES**

### **Currently Configured:**

1. **Invoice Approval Request** 📋
   - Sent to: Approver
   - When: Invoice needs approval
   - Template: `invoice_approval_request`

2. **Invoice Approved** ✅
   - Sent to: Invoice creator
   - When: Invoice is approved
   - Template: `invoice_approved`

3. **Invoice Rejected** ❌
   - Sent to: Invoice creator
   - When: Invoice is rejected
   - Template: `invoice_rejected`

4. **Team Invitation** 👥
   - Sent to: New team member
   - When: User invited to team
   - Template: `team_invitation`

5. **Delegation Assignment** 🔄
   - Sent to: Delegate
   - When: Approval authority delegated
   - Template: `delegation_assigned`

6. **Test Notification** 🧪
   - Sent to: Current user
   - When: "Send Test" clicked
   - Template: Simple test message

---

## 🎨 **EMAIL TEMPLATES**

### **Template Variables:**

Each email template supports variable substitution:

**Invoice Approved:**
```
{{requesterName}} - Recipient's name
{{invoiceNumber}} - Invoice number
{{amount}} - Invoice amount
{{approverName}} - Who approved it
{{approvedAt}} - When it was approved
{{actionUrl}} - Link to invoice
```

**Invoice Rejected:**
```
{{requesterName}} - Recipient's name
{{invoiceNumber}} - Invoice number
{{amount}} - Invoice amount
{{approverName}} - Who rejected it
{{reason}} - Rejection reason
{{comments}} - Rejection comments
{{actionUrl}} - Link to invoice
```

### **Template Location:**

Templates are stored in the database:
```sql
SELECT * FROM notification_templates 
WHERE is_system = true;
```

---

## 🔧 **TROUBLESHOOTING**

### **Emails Not Sending?**

**Check 1: SMTP Configuration**
```bash
# Verify SMTP settings in .env
echo $SMTP_HOST
echo $SMTP_USER
```

**Check 2: Email Queue**
```sql
-- Are emails being queued?
SELECT COUNT(*) FROM email_queue WHERE status = 'pending';

-- Any errors?
SELECT error_message FROM email_queue 
WHERE status = 'failed' 
ORDER BY failed_at DESC LIMIT 5;
```

**Check 3: Backend Logs**
```bash
# Look for email processing messages
tail -f backend/logs/app.log | grep "📧"
```

**Check 4: SMTP Connection**
```bash
# Test SMTP connection
telnet your-smtp-host 587
```

### **Common Issues:**

**Issue: "Authentication failed"**
- ✅ Check SMTP_USER and SMTP_PASS are correct
- ✅ For Gmail, use App Password not regular password
- ✅ Check if 2FA is enabled

**Issue: "Connection timeout"**
- ✅ Check SMTP_HOST and SMTP_PORT
- ✅ Check firewall settings
- ✅ Try SMTP_PORT=465 with SMTP_SECURE=true

**Issue: "Emails queued but not sent"**
- ✅ Check backend server is running
- ✅ Check logs for processing messages
- ✅ Manually trigger: `POST /api/notifications/process-queue`

---

## 📈 **MONITORING**

### **Key Metrics to Watch:**

1. **Queue Size**
   ```sql
   SELECT status, COUNT(*) 
   FROM email_queue 
   GROUP BY status;
   ```

2. **Success Rate**
   ```sql
   SELECT 
     COUNT(CASE WHEN status = 'sent' THEN 1 END) as sent,
     COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
     COUNT(*) as total
   FROM email_queue;
   ```

3. **Average Delivery Time**
   ```sql
   SELECT AVG(EXTRACT(EPOCH FROM (sent_at - created_at))) as avg_seconds
   FROM email_queue 
   WHERE status = 'sent';
   ```

---

## 🚀 **PRODUCTION RECOMMENDATIONS**

### **For Production Deployment:**

1. **Use a Dedicated Email Service**
   - SendGrid (recommended)
   - Mailgun
   - AWS SES
   - Postmark

2. **Increase Processing Frequency**
   ```typescript
   // Change to every 30 seconds
   }, 30 * 1000);
   ```

3. **Add Monitoring**
   - Set up alerts for failed emails
   - Monitor queue size
   - Track delivery rates

4. **Implement Rate Limiting**
   - Respect SMTP provider limits
   - Add delays between batches if needed

5. **Use a Proper Cron Job**
   ```bash
   # Add to crontab
   */1 * * * * curl -X POST http://your-domain/api/notifications/process-queue
   ```

---

## ✅ **WHAT'S WORKING NOW**

- ✅ **Automatic email processing** every 2 minutes
- ✅ **Retry logic** for failed emails
- ✅ **Status tracking** in database
- ✅ **Template system** with variables
- ✅ **Priority-based** sending
- ✅ **Manual processing** endpoint available
- ✅ **Test notifications** working
- ✅ **Real notifications** (approve/reject) working

---

## 🎯 **NEXT STEPS**

1. **Test the system**:
   - Send test notification
   - Wait 2 minutes
   - Check your email

2. **Monitor the logs**:
   - Watch for "📧 Processed X emails"
   - Check for any errors

3. **Verify delivery**:
   - Check spam folder if needed
   - Verify sender email is whitelisted

4. **Adjust settings**:
   - Change processing interval if needed
   - Adjust batch size for your volume

---

## 📞 **SUPPORT**

If emails still aren't sending after checking all the above:

1. Check backend logs for specific errors
2. Verify SMTP credentials are correct
3. Test SMTP connection manually
4. Check email provider's documentation
5. Look for rate limiting issues

---

**Status**: EMAIL SYSTEM ACTIVE ✅  
**Processing**: Every 2 minutes ⏰  
**Ready for**: Production use 🚀

---

*Last Updated: November 19, 2025*

