# 🔐 Forgot Password - Quick Reference

## 📊 **Which Roles Can Reset Password?**

| Role/Table | Password Field | Reset Available | Action |
|------------|----------------|-----------------|--------|
| **Users** (Property Managers, Tenants, Staff) | ✅ Yes | ✅ Yes | Email sent with temp password |
| **Admins** (Super Admin, Support) | ✅ Yes | ✅ Yes | Email sent with temp password |
| **Customers** (Company Owners) | ❌ No | ❌ No | Contact support message |
| **Applicants** (Pending) | ❌ No | ❌ No | Contact support message |
| **Non-existent** | N/A | N/A | Generic success (security) |

---

## 🔍 **Lookup Order**

1. **Users table** → Reset available ✅
2. **Admins table** → Reset available ✅
3. **Customers table** → Contact support ⚠️
4. **Applications table** → Contact support ⚠️
5. **Not found** → Generic success 🔒

---

## 📧 **User Messages**

### **Success (Users/Admins):**
```
✅ Email Sent & Verified!
A temporary password has been sent to your email address.
Message ID: <abc123@mail.com>
```

### **Error (Customers):**
```
❌ Password reset not available for customer accounts.
Please contact support.
```

### **Error (Applicants):**
```
❌ Password reset not available for pending applications.
Please contact support.
```

### **Generic (Not Found/Inactive):**
```
✅ If an account exists with this email,
a temporary password has been sent.
```

---

## 🧪 **Quick Test**

```bash
# Test user account
curl -X POST http://localhost:5000/api/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"manager@example.com"}'

# Expected: ✅ Email sent with temp password
```

---

## 📊 **Backend Logs**

### **Found in Users:**
```
[Forgot Password] Found in users table, role: property_manager
[Forgot Password] Password updated in users for: email@example.com
[Forgot Password] ✅ Email sent successfully
```

### **Found in Admins:**
```
[Forgot Password] Found in admins table, role: super_admin
[Forgot Password] Password updated in admins for: email@example.com
[Forgot Password] ✅ Email sent successfully
```

### **Found in Customers:**
```
[Forgot Password] Found in customers table
[Forgot Password] Warning: Customers table does not have password field
```

### **Not Found:**
```
[Forgot Password] Email not found: email@example.com
```

---

## 🔒 **Security Features**

- ✅ Case-insensitive email lookup
- ✅ Email enumeration prevention
- ✅ Active account verification
- ✅ SMTP connection verification
- ✅ Email delivery confirmation
- ✅ Message ID tracking

---

## 🎯 **Key Points**

1. **All tables checked** - users, admins, customers, applications
2. **Role identified** - logs which table and role
3. **Password only updated** - for tables with password fields
4. **Clear guidance** - contact support when needed
5. **Email validated** - SMTP verification at every step

---

**Quick Summary:** The system checks all user tables, resets passwords for users/admins, and directs others to contact support. Email delivery is validated at every step!

