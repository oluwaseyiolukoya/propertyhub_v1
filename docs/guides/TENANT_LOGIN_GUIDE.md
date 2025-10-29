# 🏠 Tenant Login Guide

## ✅ How Tenants Can Log In

Tenants can log in to their dashboard and view their rental information, make payments, submit maintenance requests, and more.

## 🎯 Quick Test - Log In As A Tenant

### Option 1: Use Existing Tenant (If Available)
If you've already created tenants through the Property Owner dashboard:

1. **Go to login page**: http://localhost:5173
2. **Select User Type**: Tenant
3. **Enter tenant credentials**:
   - Email: (the email you used when creating the tenant)
   - Password: (the password you set or that was generated)
4. **Click Login**
5. ✅ You should see the Tenant Dashboard!

### Option 2: Create a New Tenant

#### Step 1: Log in as Property Owner
```
Email: john@metro-properties.com
Password: owner123
User Type: Property Owner
```

#### Step 2: Go to Tenant Management
- Click on **"Tenant Management"** in the sidebar
- Click **"Add Tenant"** button

#### Step 3: Fill in Tenant Information
1. **Full Name**: Mike Johnson
2. **Email**: mike@email.com
3. **Phone**: +1 (555) 123-4567
4. **Monthly Rent**: 1500
5. **Temporary Password**: 
   - Click the key icon (🔑) to generate a password
   - Click copy icon to copy the password
   - **IMPORTANT**: Save this password - you'll need it to log in!
6. **Property**: Select a property from the dropdown
7. **Unit/Apartment**: Select a unit
8. **Lease Start**: Select a date
9. **Lease End**: Select an end date (e.g., 1 year from start)
10. Click **"Add Tenant & Generate Credentials"**

#### Step 4: Copy the Generated Password
- Make sure you copied the temporary password before closing the dialog
- The tenant will use this password to log in

#### Step 5: Log Out and Log In As Tenant
1. Click the profile icon and select "Logout"
2. On the login page, select **"Tenant"** as User Type
3. Enter:
   - Email: mike@email.com
   - Password: (the password you copied)
4. Click Login
5. ✅ Welcome to the Tenant Dashboard!

## 🔐 Reset Tenant Password (New Feature!)

If a tenant forgets their password, you can reset it as a Property Owner:

### As Property Owner:
1. Go to **Tenant Management**
2. Find the tenant in the list
3. Click the **blue key icon** (🔑) in the Actions column
4. Click **"Reset Password"**
5. **Copy the new generated password** (it won't be shown again!)
6. Share the password securely with the tenant

### Password Reset Features:
✅ Generates a secure 12-character password  
✅ Updates immediately in the database  
✅ Copy button with visual confirmation  
✅ Password can be changed by tenant after first login  

## 🎨 Tenant Dashboard Features

Once logged in, tenants can:

### 📊 Dashboard Overview
- View property and unit details
- See lease information and expiration
- Check rent payment status
- View upcoming payment due dates

### 💰 Payments
- View payment history
- Make rent payments
- Download payment receipts
- Track payment status

### 🔧 Maintenance Requests
- Submit new maintenance requests
- Track existing requests
- View request status and updates
- Add photos and descriptions

### 📄 Documents
- Access lease agreement
- View payment receipts
- Read property notices and announcements
- Download important documents

### ⚙️ Settings
- Update profile information
- Change password
- Update contact details
- Manage preferences

## 🔍 Troubleshooting

### Issue: "Invalid credentials"
**Solution**: 
- Make sure you selected "Tenant" as the User Type
- Verify the email and password are correct
- Check if the tenant account was created properly

### Issue: "Account is inactive"
**Solution**: 
- Contact your property owner/manager
- They can activate your account from their dashboard

### Issue: "Forgot Password"
**Solution**: 
- Contact your property owner/manager
- They can reset your password using the new reset password feature
- They will provide you with a new temporary password

## 📝 Important Notes

1. **First Login**: Change your password after first login for security
2. **Password Reset**: Only property owners can reset tenant passwords
3. **Active Lease**: You must have an active lease to access the dashboard
4. **Contact Info**: Keep your email and phone number up-to-date

## 🚀 Current System Status

✅ **Frontend**: Running on http://localhost:5173  
✅ **Backend**: Running on http://localhost:5000  
✅ **Database**: PostgreSQL connected  
✅ **Tenant Login**: Fully functional  
✅ **Password Reset**: Available for property owners  
✅ **Tenant Dashboard**: Ready to use  

## 🎯 Test Flow Example

```
1. Property Owner creates tenant:
   - Name: Mike Johnson
   - Email: mike@email.com
   - Password: Generated (e.g., "abc123XY456Z")
   - Copies password

2. Owner shares credentials with tenant

3. Tenant logs in:
   - Selects "Tenant" user type
   - Enters mike@email.com
   - Enters password: abc123XY456Z
   - Clicks Login

4. Tenant sees their dashboard:
   - Property: Sunset Apartments
   - Unit: Apartment 101
   - Rent: $1,500/month
   - Lease expires: December 31, 2025
```

## 💡 Tips

- **For Property Owners**: Always copy and save tenant passwords before closing the dialog
- **For Tenants**: Change your password immediately after first login
- **Security**: Never share your password via insecure channels (email, SMS)
- **Password Reset**: If you forget your password, ask your property owner to reset it

---

**Need Help?** 
- Check the main LOGIN_CREDENTIALS.md for all user types
- View Prisma Studio at http://localhost:5555 to see database records
- Contact system administrator for technical issues

