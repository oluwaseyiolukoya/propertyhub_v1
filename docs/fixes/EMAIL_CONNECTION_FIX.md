# Email Connection Timeout - Fix

## 🐛 **Issue Detected**

```json
{
  "success": false,
  "message": "Email connection failed: Connection timeout",
  "error": {
    "code": "ETIMEDOUT",
    "command": "CONN"
  }
}
```

## 🔍 **Current Configuration**

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=true  ❌ INCORRECT for port 587
SMTP_USER=your-email@gmail.com
```

## ✅ **Solution**

### **For Gmail SMTP (Port 587 - STARTTLS):**

Update your `backend/.env` file:

```env
# Gmail SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false  ✅ MUST be false for port 587 (STARTTLS)
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=your-email@gmail.com
FRONTEND_URL=https://contrezz.com
```

### **For Gmail SMTP (Port 465 - SSL/TLS):**

Alternatively, use port 465 with SSL:

```env
# Gmail SMTP Configuration (SSL)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true  ✅ Use true for port 465 (direct SSL)
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=your-email@gmail.com
FRONTEND_URL=https://contrezz.com
```

## 🔐 **Gmail App Password Required**

Gmail requires an **App Password** for SMTP authentication (not your regular Gmail password).

### **Steps to Generate Gmail App Password:**

1. **Enable 2-Step Verification:**
   - Go to https://myaccount.google.com/security
   - Enable "2-Step Verification"

2. **Generate App Password:**
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)"
   - Enter "Contrezz Platform"
   - Click "Generate"
   - Copy the 16-character password

3. **Update `.env`:**
   ```env
   SMTP_PASS=your-16-char-app-password
   ```

## 📝 **Port Comparison**

| Port | Protocol | SMTP_SECURE | Use Case |
|------|----------|-------------|----------|
| 587 | STARTTLS | `false` | ✅ Recommended for Gmail |
| 465 | SSL/TLS | `true` | ✅ Alternative for Gmail |
| 25 | Plain | `false` | ❌ Not recommended (often blocked) |

## 🔄 **After Updating `.env`**

The backend will automatically reload the configuration. Test again:

```bash
TOKEN="your-admin-token"

# Test connection
curl -X GET http://localhost:5000/api/email-test/connection \
  -H "Authorization: Bearer $TOKEN"
```

## 🎯 **Expected Success Response**

```json
{
  "success": true,
  "message": "Email connection successful! SMTP server is ready to send emails."
}
```

## 📧 **For Namecheap Email (Original Plan)**

If you want to use Namecheap instead of Gmail:

```env
# Namecheap Private Email SMTP
SMTP_HOST=mail.privateemail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=noreply@yourdomain.com
SMTP_PASS=your-namecheap-email-password
SMTP_FROM=noreply@yourdomain.com
FRONTEND_URL=https://contrezz.com
```

**OR with STARTTLS:**

```env
# Namecheap Private Email SMTP (STARTTLS)
SMTP_HOST=mail.privateemail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=noreply@yourdomain.com
SMTP_PASS=your-namecheap-email-password
SMTP_FROM=noreply@yourdomain.com
FRONTEND_URL=https://contrezz.com
```

## 🐛 **Other Possible Issues**

### **1. Firewall Blocking**
- Check if your firewall allows outgoing connections on port 587/465
- Try from a different network

### **2. Gmail "Less Secure Apps"**
- Gmail no longer supports "less secure apps"
- You MUST use an App Password

### **3. Network Restrictions**
- Some networks block SMTP ports
- Try using a VPN or different network

### **4. Incorrect Credentials**
- Verify email address is correct
- Ensure App Password is correct (no spaces)
- Try logging into Gmail webmail to verify

## 🧪 **Quick Test Commands**

After fixing the configuration:

```bash
# 1. Get fresh admin token
TOKEN=$(curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@contrezz.com","password":"admin123","userType":"admin"}' \
  -s | jq -r '.token')

# 2. Test connection
curl -X GET http://localhost:5000/api/email-test/connection \
  -H "Authorization: Bearer $TOKEN" \
  -s | jq .

# 3. Send test email (replace with your email)
curl -X POST http://localhost:5000/api/email-test/send \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"to":"your-email@example.com"}' \
  -s | jq .
```

---

**Next Action:** 
1. ✅ Update `SMTP_SECURE=false` in `.env` (for port 587)
2. ✅ Generate Gmail App Password
3. ✅ Update `SMTP_PASS` with App Password
4. ✅ Test connection again

Let me know once you've updated the `.env` file and I'll test it again! 🚀






