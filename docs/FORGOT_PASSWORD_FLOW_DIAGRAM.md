# 🔐 Forgot Password - Flow Diagram

## 📊 **Complete Flow**

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER ENTERS EMAIL                             │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                  CHECK USERS TABLE                               │
│  SELECT * FROM users WHERE email = ?                             │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                ┌───────────┴───────────┐
                │                       │
            FOUND?                   NOT FOUND
                │                       │
                ▼                       ▼
    ┌───────────────────────┐  ┌─────────────────────────────────┐
    │  ROLE: User           │  │   CHECK ADMINS TABLE            │
    │  TABLE: users         │  │   SELECT * FROM admins          │
    │  PASSWORD: ✅ Yes     │  │   WHERE email = ?               │
    └───────┬───────────────┘  └──────────┬──────────────────────┘
            │                              │
            │                  ┌───────────┴───────────┐
            │                  │                       │
            │              FOUND?                   NOT FOUND
            │                  │                       │
            │                  ▼                       ▼
            │      ┌───────────────────────┐  ┌─────────────────────┐
            │      │  ROLE: Admin          │  │  CHECK CUSTOMERS    │
            │      │  TABLE: admins        │  │  TABLE              │
            │      │  PASSWORD: ✅ Yes     │  │  SELECT * FROM      │
            │      └───────┬───────────────┘  │  customers          │
            │              │                  │  WHERE email = ?    │
            │              │                  └──────────┬──────────┘
            │              │                             │
            │              │                 ┌───────────┴────────┐
            │              │                 │                    │
            │              │             FOUND?              NOT FOUND
            │              │                 │                    │
            │              │                 ▼                    ▼
            │              │     ┌──────────────────┐  ┌─────────────┐
            │              │     │  ROLE: Customer  │  │  CHECK      │
            │              │     │  TABLE: customers│  │  ONBOARDING │
            │              │     │  PASSWORD: ❌ No │  │  APPS TABLE │
            │              │     └────────┬─────────┘  └──────┬──────┘
            │              │              │                   │
            │              │              │       ┌───────────┴────┐
            │              │              │       │                │
            │              │              │   FOUND?          NOT FOUND
            │              │              │       │                │
            │              │              │       ▼                ▼
            │              │              │  ┌─────────┐  ┌────────────┐
            │              │              │  │Applicant│  │ NOT FOUND  │
            │              │              │  │PASSWORD:│  │ ANYWHERE   │
            │              │              │  │❌ No    │  └──────┬─────┘
            │              │              │  └────┬────┘         │
            │              │              │       │              │
            ▼              ▼              ▼       ▼              ▼
    ┌──────────────┐ ┌──────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐
    │ GENERATE     │ │ GENERATE     │ │ RETURN     │ │ RETURN     │ │ RETURN     │
    │ TEMP         │ │ TEMP         │ │ ERROR:     │ │ ERROR:     │ │ GENERIC    │
    │ PASSWORD     │ │ PASSWORD     │ │ Contact    │ │ Contact    │ │ SUCCESS    │
    └──────┬───────┘ └──────┬───────┘ │ Support    │ │ Support    │ │ (Security) │
           │                │         └────────────┘ └────────────┘ └────────────┘
           ▼                ▼
    ┌──────────────┐ ┌──────────────┐
    │ HASH         │ │ HASH         │
    │ PASSWORD     │ │ PASSWORD     │
    └──────┬───────┘ └──────┬───────┘
           │                │
           ▼                ▼
    ┌──────────────┐ ┌──────────────┐
    │ UPDATE       │ │ UPDATE       │
    │ users.       │ │ admins.      │
    │ password     │ │ password     │
    └──────┬───────┘ └──────┬───────┘
           │                │
           └────────┬───────┘
                    │
                    ▼
         ┌──────────────────────┐
         │ VERIFY SMTP          │
         │ CONNECTION           │
         └──────────┬───────────┘
                    │
         ┌──────────┴──────────┐
         │                     │
     SUCCESS                FAILED
         │                     │
         ▼                     ▼
┌────────────────┐    ┌────────────────┐
│ SEND EMAIL     │    │ TRY FRESH      │
│ WITH TEMP      │    │ TRANSPORTER    │
│ PASSWORD       │    └────────┬───────┘
└────────┬───────┘             │
         │          ┌──────────┴──────────┐
         │          │                     │
         │      SUCCESS                FAILED
         │          │                     │
         └──────────┴─────────┐           │
                    │         │           │
                    ▼         ▼           ▼
         ┌──────────────┐ ┌──────────────┐
         │ CHECK EMAIL  │ │ RETURN ERROR │
         │ ACCEPTED?    │ │ EMAIL FAILED │
         └──────┬───────┘ └──────────────┘
                │
     ┌──────────┴──────────┐
     │                     │
 ACCEPTED              REJECTED
     │                     │
     ▼                     ▼
┌─────────────┐    ┌──────────────┐
│ RETURN      │    │ RETURN ERROR │
│ SUCCESS +   │    │ EMAIL        │
│ MESSAGE ID  │    │ REJECTED     │
└─────────────┘    └──────────────┘
```

---

## 🎯 **Decision Points**

### **1. Users Table Check**
- ✅ **Found** → Has password field → Process reset
- ❌ **Not Found** → Continue to next table

### **2. Admins Table Check**
- ✅ **Found** → Has password field → Process reset
- ❌ **Not Found** → Continue to next table

### **3. Customers Table Check**
- ✅ **Found** → ❌ No password field → Return error
- ❌ **Not Found** → Continue to next table

### **4. Applications Table Check**
- ✅ **Found** → ❌ No password field → Return error
- ❌ **Not Found** → Return generic success

---

## 📊 **Table Comparison**

```
┌─────────────────────┬──────────────┬─────────────────┬──────────────┐
│ Table               │ Password     │ Reset Available │ Action       │
├─────────────────────┼──────────────┼─────────────────┼──────────────┤
│ users               │ ✅ Yes       │ ✅ Yes          │ Send Email   │
├─────────────────────┼──────────────┼─────────────────┼──────────────┤
│ admins              │ ✅ Yes       │ ✅ Yes          │ Send Email   │
├─────────────────────┼──────────────┼─────────────────┼──────────────┤
│ customers           │ ❌ No        │ ❌ No           │ Error Msg    │
├─────────────────────┼──────────────┼─────────────────┼──────────────┤
│ onboarding_apps     │ ❌ No        │ ❌ No           │ Error Msg    │
├─────────────────────┼──────────────┼─────────────────┼──────────────┤
│ Not Found           │ N/A          │ N/A             │ Generic Msg  │
└─────────────────────┴──────────────┴─────────────────┴──────────────┘
```

---

## 🔒 **Security Flow**

```
┌─────────────────────────────────────────────────────────────────┐
│                    EMAIL SUBMITTED                               │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
                ┌───────────────────────┐
                │ Convert to lowercase  │
                └───────────┬───────────┘
                            │
                            ▼
                ┌───────────────────────┐
                │ Check all tables      │
                └───────────┬───────────┘
                            │
                ┌───────────┴───────────┐
                │                       │
            FOUND                   NOT FOUND
                │                       │
                ▼                       ▼
        ┌───────────────┐      ┌──────────────────┐
        │ Check active? │      │ Return generic   │
        └───────┬───────┘      │ success message  │
                │              │ (Prevent email   │
        ┌───────┴───────┐      │ enumeration)     │
        │               │      └──────────────────┘
    ACTIVE          INACTIVE
        │               │
        ▼               ▼
┌───────────────┐ ┌──────────────────┐
│ Process reset │ │ Return generic   │
└───────────────┘ │ success message  │
                  │ (Prevent email   │
                  │ enumeration)     │
                  └──────────────────┘
```

---

## 📧 **Email Validation Flow**

```
┌─────────────────────────────────────────────────────────────────┐
│              PASSWORD UPDATED IN DATABASE                        │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
                ┌───────────────────────┐
                │ Check SMTP configured?│
                └───────────┬───────────┘
                            │
                ┌───────────┴───────────┐
                │                       │
            YES                        NO
                │                       │
                ▼                       ▼
    ┌───────────────────────┐  ┌──────────────────┐
    │ Verify SMTP connection│  │ Return error:    │
    └───────────┬───────────┘  │ Not configured   │
                │              └──────────────────┘
    ┌───────────┴───────────┐
    │                       │
SUCCESS                  FAILED
    │                       │
    ▼                       ▼
┌───────────┐      ┌────────────────────┐
│ Send email│      │ Try fresh          │
└─────┬─────┘      │ transporter        │
      │            └──────────┬─────────┘
      │                       │
      │            ┌──────────┴─────────┐
      │            │                    │
      │        SUCCESS              FAILED
      │            │                    │
      └────────────┴────────┐           │
                   │        │           │
                   ▼        ▼           ▼
           ┌──────────────┐    ┌───────────────┐
           │ Check email  │    │ Return error: │
           │ accepted?    │    │ Email failed  │
           └──────┬───────┘    └───────────────┘
                  │
      ┌───────────┴───────────┐
      │                       │
  ACCEPTED                REJECTED
      │                       │
      ▼                       ▼
┌─────────────┐      ┌────────────────┐
│ ✅ SUCCESS  │      │ ❌ ERROR       │
│ + Message ID│      │ Email rejected │
└─────────────┘      └────────────────┘
```

---

## 🎯 **Summary**

The forgot password system:

1. **Checks 4 tables** sequentially (users → admins → customers → applications)
2. **Identifies role** and logs which table found the email
3. **Validates password field** exists before attempting reset
4. **Generates temp password** (8 characters, alphanumeric)
5. **Updates database** (only for tables with password field)
6. **Verifies SMTP** connection before sending
7. **Sends email** with temporary password
8. **Validates delivery** (checks accepted/rejected)
9. **Returns status** with message ID (in dev mode)
10. **Maintains security** (prevents email enumeration)

**All roles covered with appropriate handling!** 🎉

