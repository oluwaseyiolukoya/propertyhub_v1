# 🔑 How to Get Digital Ocean Spaces Access Keys

## ⚠️ **Important: Spaces Keys ≠ Personal Access Tokens**

You're currently using a **Personal Access Token** (`dop_...`), but you need **Spaces Access Keys** for S3-compatible storage.

---

## 📋 **Step-by-Step Guide**

### **Step 1: Go to Spaces Keys Page**

Visit: https://cloud.digitalocean.com/account/api/spaces

**OR**

1. Go to https://cloud.digitalocean.com/
2. Click your profile picture (top right)
3. Click **API**
4. Click **Spaces Keys** tab (NOT "Tokens")

---

### **Step 2: Generate New Spaces Key**

1. Click the **"Generate New Key"** button
2. Give it a name (e.g., "Contrezz Storage")
3. Click **"Generate Key"**

---

### **Step 3: Copy Your Keys**

You'll see two keys:

```
Access Key: DO00XXXXXXXXXXXXXXXXX (20 characters)
Secret Key: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx (40 characters)
```

**⚠️ IMPORTANT:** Copy both keys immediately! The secret key won't be shown again.

---

### **Step 4: Update Your .env File**

Open `backend/.env` and update these lines:

```env
DO_SPACES_ACCESS_KEY_ID=DO00XXXXXXXXXXXXXXXXX
DO_SPACES_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Format Rules:**
- ✅ NO quotes around the keys
- ✅ NO spaces before or after the keys
- ✅ NO `dop_` prefix (that's a Personal Access Token, not a Spaces Key)
- ✅ Access Key should be 20 characters
- ✅ Secret Key should be 40 characters

---

### **Step 5: Test the Connection**

```bash
cd /Users/oluwaseyio/test_ui_figma_and_cursor/backend
node scripts/test-spaces-connection.js
```

**Expected Output:**
```
✅ Connection successful!
📦 Available buckets: contrezz-uploads
✅ File upload successful!
```

---

## 🔍 **Verify Your Keys**

Run this to check if your keys are in the correct format:

```bash
node scripts/validate-spaces-credentials.js
```

**Correct Format:**
```
✅ DO_SPACES_ACCESS_KEY_ID is set
   Length: 20 characters
   First 4 chars: DO00...

✅ DO_SPACES_SECRET_ACCESS_KEY is set
   Length: 40 characters
   First 4 chars: (random alphanumeric)...
```

**Incorrect Format (what you have now):**
```
❌ Secret Key starts with dop_ (this is a Personal Access Token)
❌ Secret Key is 71 characters (should be 40)
```

---

## 📸 **Visual Guide**

### **Where to Find Spaces Keys:**

```
Digital Ocean Dashboard
├── API (in sidebar or profile menu)
│   ├── Tokens (❌ NOT THIS - for API calls)
│   └── Spaces Keys (✅ THIS ONE - for S3 storage)
│       └── Generate New Key
```

---

## 🆘 **Still Having Issues?**

### **Issue: "Signature does not match"**
- You're using a Personal Access Token instead of Spaces Keys
- Solution: Generate Spaces Keys as described above

### **Issue: "Access Denied"**
- Your Spaces Keys might be for a different team/account
- Solution: Make sure you're logged into the correct Digital Ocean account

### **Issue: "Bucket not found"**
- Your keys are correct, but bucket name might be wrong
- Solution: Verify bucket name at https://cloud.digitalocean.com/spaces

---

## ✅ **Quick Checklist**

- [ ] Go to https://cloud.digitalocean.com/account/api/spaces
- [ ] Click "Generate New Key" (NOT "Generate New Token")
- [ ] Copy both Access Key and Secret Key
- [ ] Update `backend/.env` with the new keys
- [ ] Remove any quotes or spaces
- [ ] Verify Access Key is 20 characters
- [ ] Verify Secret Key is 40 characters (NOT 71)
- [ ] Verify Secret Key does NOT start with `dop_`
- [ ] Run `node scripts/test-spaces-connection.js`
- [ ] See "✅ Connection successful!"

---

**Once you have the correct Spaces Keys, the connection will work!** 🚀

