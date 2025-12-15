# Creating the First Public Admin User

## 🎯 Overview

Since the registration endpoint requires an existing admin, you need to create the first admin user manually. This guide provides multiple methods to do this.

## 📋 Prerequisites

- Public backend database is set up and migrations are applied
- `PUBLIC_DATABASE_URL` is configured in `public-backend/.env`
- Node.js and npm are installed

## 🚀 Method 1: Using the Script (Recommended)

### Step 1: Run the Script

```bash
cd public-backend
npm run create-admin
```

### Step 2: Follow the Prompts

The script will ask you for:

- **Email**: Admin email address (e.g., `admin@contrezz.com`)
- **Name**: Admin full name (e.g., `Admin User`)
- **Password**: Admin password (minimum 8 characters)
- **Confirm Password**: Re-enter the password

### Step 3: Verify Creation

The script will display the created admin details and confirm success.

### Example Output

```
╔════════════════════════════════════════╗
║   Create First Public Admin User      ║
╚════════════════════════════════════════╝

Enter admin email: admin@contrezz.com
Enter admin name: Admin User
Enter admin password: ********
Confirm password: ********

🔐 Hashing password...
👤 Creating admin user...

✅ Admin user created successfully!

📋 Admin Details:
   ID: abc123...
   Email: admin@contrezz.com
   Name: Admin User
   Role: admin
   Active: true
   Created: 2025-12-15T...

🔑 You can now log in to the admin interface with:
   Email: admin@contrezz.com
   Password: [the password you entered]

🌐 Access the admin interface at:
   Local: http://localhost:5173/admin/login
   Production: https://admin.contrezz.com
```

## 🔧 Method 2: Using Environment Variables

You can also provide values via environment variables:

```bash
cd public-backend
EMAIL=admin@contrezz.com NAME="Admin User" PASSWORD=yourpassword npm run create-admin
```

**Note**: Using environment variables skips password confirmation.

## 🗄️ Method 3: Using Prisma Studio

### Step 1: Open Prisma Studio

```bash
cd public-backend
npm run prisma:studio
```

### Step 2: Create Admin Manually

1. Prisma Studio will open in your browser
2. Navigate to the `public_admins` table
3. Click "Add record"
4. Fill in the fields:
   - `email`: Your admin email
   - `name`: Admin name
   - `password`: **You need to hash this first** (see below)
   - `role`: `admin`
   - `isActive`: `true`
5. Click "Save 1 change"

### Step 3: Hash the Password

You need to hash the password before inserting. Run this in Node.js:

```bash
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('yourpassword', 10).then(hash => console.log(hash));"
```

Copy the hashed password and use it in Prisma Studio.

## 💻 Method 4: Direct Database Insert (Advanced)

### Step 1: Hash the Password

```bash
cd public-backend
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('yourpassword', 10).then(hash => console.log('Hashed:', hash));"
```

### Step 2: Insert into Database

Using `psql` or your database client:

```sql
INSERT INTO public_admins (id, email, name, password, role, "isActive", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'admin@contrezz.com',
  'Admin User',
  'YOUR_HASHED_PASSWORD_HERE',
  'admin',
  true,
  NOW(),
  NOW()
);
```

## ✅ Verification

After creating the admin, verify it was created:

### Using the Script

The script will automatically display the created admin details.

### Using Prisma Studio

```bash
cd public-backend
npm run prisma:studio
```

Navigate to `public_admins` table and verify your admin exists.

### Using Database Query

```bash
cd public-backend
npx prisma studio
# Or use psql to query directly
```

## 🔐 Security Best Practices

1. **Strong Password**: Use a password with:

   - At least 12 characters
   - Mix of uppercase, lowercase, numbers, and symbols
   - Not used elsewhere

2. **Secure Storage**: Never commit admin credentials to git

3. **First Admin**: The first admin should have `role: "admin"` for full access

4. **Additional Admins**: Create additional admins through the admin interface after logging in

## 🧪 Test Login

After creating the admin:

1. Start the public backend:

   ```bash
   cd public-backend
   npm run dev
   ```

2. Start the frontend:

   ```bash
   npm run dev
   ```

3. Navigate to: `http://localhost:5173/admin/login`

4. Enter your credentials:

   - Email: The email you used
   - Password: The password you set

5. You should be redirected to the admin dashboard

## 🚨 Troubleshooting

### Error: "Admin with this email already exists"

**Solution**: The email is already in use. Either:

- Use a different email
- Delete the existing admin first (via Prisma Studio or database)
- Update the existing admin instead

### Error: "Password must be at least 8 characters"

**Solution**: Use a longer password (minimum 8 characters).

### Error: "Cannot connect to database"

**Solution**:

1. Check `PUBLIC_DATABASE_URL` in `public-backend/.env`
2. Verify the database is running
3. Check network connectivity

### Error: "Table 'public_admins' does not exist"

**Solution**: Run migrations first:

```bash
cd public-backend
npx prisma migrate dev
```

## 📝 Next Steps

After creating the first admin:

1. ✅ Log in to the admin interface
2. ✅ Verify you can access all sections
3. ✅ Create additional admins through the interface (if needed)
4. ✅ Test landing page management
5. ✅ Test career management
6. ✅ Configure DNS for production (`admin.contrezz.com`)

## 🔗 Related Documentation

- `PHASE1_COMPLETE.md` - Backend setup
- `PHASE2_COMPLETE.md` - Frontend setup
- `ENV_VARIABLES_SETUP.md` - Environment configuration

---

**Quick Command**: `cd public-backend && npm run create-admin`
