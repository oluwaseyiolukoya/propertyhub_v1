# 🔑 How to Get Digital Ocean Spaces Access Keys (2024 Updated)

## 📍 **Current Digital Ocean Interface**

Digital Ocean has updated their API page. Here's the correct process:

---

## 📋 **Step-by-Step Guide**

### **Step 1: Go to API Page**

Visit: https://cloud.digitalocean.com/account/api

**OR**

1. Go to https://cloud.digitalocean.com/
2. Click **API** in the left sidebar
3. You'll see two sections:
   - **Personal Access Tokens** (at the top)
   - **Spaces access keys** (scroll down) ← **THIS IS WHAT YOU NEED**

---

### **Step 2: Scroll Down to "Spaces access keys" Section**

On the API page, **scroll down past** the "Personal Access Tokens" section.

You should see a section titled **"Spaces access keys"** or **"Spaces Keys"**.

---

### **Step 3: Generate New Spaces Access Key**

1. In the **Spaces access keys** section, click **"Generate New Key"**
2. Give it a name (e.g., "Contrezz Storage")
3. **Configure Access Permissions:**
   - **Option 1: Full Access** (Recommended for development)
     - Select "Full Access" to allow all S3 operations on all buckets
   - **Option 2: Limited Access** (For production)
     - Select specific buckets (e.g., `contrezz-uploads`)
     - Choose permissions: Read or Read/Write/Delete
4. Click **"Create Access Key"** or **"Generate Key"**

---

### **Step 4: Copy Your Keys IMMEDIATELY**

⚠️ **CRITICAL:** The Secret Key is shown **ONLY ONCE**!

You'll see:
```
Access Key: DO00XXXXXXXXXXXXXXXXX (20 characters)
Secret Key: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx (40 characters)
```

**Copy both keys to a safe place immediately!**

---

### **Step 5: Update Your .env File**

Open `backend/.env` and add/update these lines:

```env
# Digital Ocean Spaces Configuration
DO_SPACES_ENDPOINT=https://nyc3.digitaloceanspaces.com
DO_SPACES_REGION=nyc3
DO_SPACES_BUCKET=contrezz-uploads
DO_SPACES_ACCESS_KEY_ID=DO00XXXXXXXXXXXXXXXXX
DO_SPACES_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Format Rules:**
- ✅ NO quotes around the keys
- ✅ NO spaces before or after the keys
- ✅ Access Key should be 20 characters (starts with `DO00`)
- ✅ Secret Key should be 40 characters (random alphanumeric)
- ❌ NOT `dop_...` (that's a Personal Access Token)

---

### **Step 6: Test the Connection**

```bash
cd /Users/oluwaseyio/test_ui_figma_and_cursor/backend
node scripts/test-spaces-connection.js
```

**Expected Output:**
```
🌊 Testing Digital Ocean Spaces Connection...

📋 Environment Configuration:
   Endpoint: https://nyc3.digitaloceanspaces.com
   Region: nyc3
   Bucket: contrezz-uploads
   Access Key: ✅ Set
   Secret Key: ✅ Set

🧪 Test 1: Listing buckets...
✅ Connection successful!
📦 Available buckets: contrezz-uploads

🧪 Test 2: Uploading test file...
✅ File upload successful!
📁 Test file uploaded to: test/connection-test.txt

🧪 Test 3: Verifying file exists...
✅ File verification successful!

✨ All tests passed! Your Digital Ocean Spaces is ready!
```

---

## 🔍 **Visual Guide: Where to Find Spaces Keys**

```
Digital Ocean Dashboard
└── API (left sidebar)
    └── [Scroll Down Past Personal Access Tokens]
        └── Spaces access keys ← YOU ARE HERE
            ├── Generate New Key
            ├── Configure Permissions
            │   ├── Full Access (all buckets)
            │   └── Limited Access (per bucket)
            └── Copy Access Key + Secret Key
```

---

## 📸 **What You Should See**

### **API Page Layout:**

```
┌─────────────────────────────────────────┐
│  Personal Access Tokens                 │
│  [Generate New Token]                   │
│  (You see this at the top)              │
└─────────────────────────────────────────┘
              ↓ SCROLL DOWN ↓
┌─────────────────────────────────────────┐
│  Spaces access keys                     │  ← THIS SECTION
│  [Generate New Key]                     │
│                                         │
│  Existing Keys:                         │
│  • Key Name | Access Key | Created     │
└─────────────────────────────────────────┘
```

---

## 🆕 **New Features (2024)**

Digital Ocean now offers **Per-Bucket Access Keys** for enhanced security:

- **Full Access**: All S3 operations on all buckets
- **Limited Access**: Granular control per bucket
  - Read only
  - Read/Write
  - Read/Write/Delete

**For Development:** Use "Full Access"  
**For Production:** Use "Limited Access" with specific permissions

---

## 🐛 **Troubleshooting**

### **"I don't see Spaces access keys section"**

**Solution:**
1. Make sure you're on the API page: https://cloud.digitalocean.com/account/api
2. **Scroll down** - it's below Personal Access Tokens
3. If still not visible, you may need to create a Space first:
   - Go to https://cloud.digitalocean.com/spaces
   - Click "Create a Space"
   - Then return to API page

---

### **"I only see Personal Access Tokens"**

**This is the wrong section!** 

- ❌ Personal Access Tokens = For DigitalOcean API calls (`dop_...`)
- ✅ Spaces access keys = For S3-compatible storage (`DO00...`)

**Keep scrolling down on the API page!**

---

### **"I accidentally closed the window and lost my Secret Key"**

**Solution:**
1. You'll need to generate a new key
2. Delete the old key (for security)
3. Generate a new one and copy both keys immediately
4. Update your `.env` file with the new keys

---

### **"Connection still fails after updating keys"**

**Checklist:**
1. Verify keys in `.env` have NO quotes
2. Verify keys have NO spaces
3. Verify Access Key is 20 characters
4. Verify Secret Key is 40 characters
5. Restart your backend server (to reload .env)
6. Run validation: `node scripts/validate-spaces-credentials.js`

---

## ✅ **Quick Checklist**

- [ ] Go to https://cloud.digitalocean.com/account/api
- [ ] Scroll down to "Spaces access keys" section
- [ ] Click "Generate New Key"
- [ ] Name it "Contrezz Storage"
- [ ] Choose "Full Access" (for now)
- [ ] Click "Create Access Key"
- [ ] Copy Access Key (20 chars, starts with DO00)
- [ ] Copy Secret Key (40 chars, random alphanumeric)
- [ ] Update `backend/.env` with both keys
- [ ] NO quotes, NO spaces in .env
- [ ] Run `node scripts/test-spaces-connection.js`
- [ ] See "✅ Connection successful!"

---

## 📚 **Official Documentation**

- [Managing Access to Spaces](https://docs.digitalocean.com/products/spaces/how-to/manage-access/)
- [Spaces API Reference](https://docs.digitalocean.com/reference/api/spaces-api/)
- [Per-Bucket Access Keys](https://docs.digitalocean.com/products/spaces/how-to/manage-access/#per-bucket-keys)

---

**Once you have the correct Spaces Access Keys, the connection will work!** 🚀

**Current Status:** You have a Personal Access Token (`dop_...`). You need to get Spaces Access Keys (`DO00...`) from the section below Personal Access Tokens on the API page.

