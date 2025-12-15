# How to Access the Public Admin Page

## 🎯 Overview

The public admin interface is accessible via the `admin.contrezz.com` subdomain (or `admin.contrezz.local` for local development).

## 🌐 Access Methods

### Method 1: Using Subdomain (Recommended)

#### Local Development

1. **Add to `/etc/hosts`** (if not already done):

   ```bash
   sudo nano /etc/hosts
   ```

   Add this line:

   ```
   127.0.0.1 admin.contrezz.local
   ```

2. **Start the frontend**:

   ```bash
   npm run dev
   ```

3. **Access the admin interface**:

   ```
   http://admin.contrezz.local:5173
   ```

   Or if using a different port:

   ```
   http://admin.contrezz.local:5174
   ```

#### Production

Once DNS is configured:

```
https://admin.contrezz.com
```

### Method 2: Using Path (Alternative for Local)

If you haven't set up the subdomain locally, you can access it via path:

1. **Start the frontend**:

   ```bash
   npm run dev
   ```

2. **Access directly**:

   ```
   http://localhost:5173/admin/login
   ```

   **Note**: This may not work perfectly because the routing logic checks for the admin subdomain. The subdomain method is recommended.

### Method 3: Force Admin Mode (Development Only)

You can temporarily modify the routing to always show admin interface for testing:

1. In `src/App.tsx`, temporarily change:

   ```typescript
   const isAdminDomain = true; // Force admin mode
   ```

2. Access at: `http://localhost:5173`

3. **Remember to revert this change** after testing!

## 🔧 Setup Steps

### Step 1: Configure Local DNS

Add to `/etc/hosts`:

```
127.0.0.1 admin.contrezz.local
```

**macOS/Linux**:

```bash
sudo nano /etc/hosts
# Add the line above
# Save and exit (Ctrl+X, then Y, then Enter)
```

**Windows**:

1. Open Notepad as Administrator
2. Open `C:\Windows\System32\drivers\etc\hosts`
3. Add the line above
4. Save

### Step 2: Flush DNS Cache

**macOS**:

```bash
sudo dscacheutil -flushcache
sudo killall -HUP mDNSResponder
```

**Linux**:

```bash
sudo systemd-resolve --flush-caches
# Or
sudo service network-manager restart
```

**Windows**:

```bash
ipconfig /flushdns
```

### Step 3: Start Services

**Terminal 1 - Public Backend**:

```bash
cd public-backend
npm run dev
```

**Terminal 2 - Frontend**:

```bash
npm run dev
```

### Step 4: Access Admin Interface

Open your browser and navigate to:

```
http://admin.contrezz.local:5173
```

You should see the login page.

## 🔐 Login Credentials

After creating your first admin user (see `CREATE_FIRST_ADMIN.md`), use:

- **Email**: The email you used when creating the admin
- **Password**: The password you set

## 🚨 Troubleshooting

### Issue: "This site can't be reached" or DNS error

**Solution**:

1. Verify `/etc/hosts` entry is correct
2. Flush DNS cache (see above)
3. Restart your browser
4. Try accessing `http://127.0.0.1:5173` first to verify frontend is running

### Issue: Shows landing page instead of admin login

**Solution**:

1. Check the URL - it should be `admin.contrezz.local` not `contrezz.local`
2. Verify the frontend is running on the correct port
3. Check browser console for errors
4. Verify `isAdminDomain` logic in `src/App.tsx`

### Issue: "Cannot connect to API" or CORS errors

**Solution**:

1. Verify public backend is running (`http://localhost:5001`)
2. Check `VITE_PUBLIC_ADMIN_API_URL` in `.env`:
   ```env
   VITE_PUBLIC_ADMIN_API_URL=http://localhost:5001/api/admin
   ```
3. Check `ALLOWED_ORIGINS` in `public-backend/.env`:
   ```env
   ALLOWED_ORIGINS=http://localhost:5173,http://admin.contrezz.local:5173,https://admin.contrezz.com
   ```
4. Restart both frontend and backend after changing `.env`

### Issue: Login page shows but login fails

**Solution**:

1. Verify admin user was created (see `CREATE_FIRST_ADMIN.md`)
2. Check public backend logs for errors
3. Verify `PUBLIC_ADMIN_JWT_SECRET` is set in `public-backend/.env`
4. Check browser console for API errors

### Issue: Redirects to wrong page after login

**Solution**:

1. Check that `publicAdminAuthenticated` state is being set correctly
2. Verify token is stored in localStorage (check browser DevTools)
3. Check `PublicAdminLayout` component is rendering correctly

## 📋 Quick Checklist

Before accessing the admin interface:

- [ ] Public backend is running (`http://localhost:5001`)
- [ ] Frontend is running (`http://localhost:5173`)
- [ ] `/etc/hosts` has `admin.contrezz.local` entry
- [ ] DNS cache has been flushed
- [ ] First admin user has been created
- [ ] Environment variables are set correctly
- [ ] Browser is accessing `http://admin.contrezz.local:5173`

## 🎯 Expected Flow

1. **Navigate to**: `http://admin.contrezz.local:5173`
2. **See**: Public Admin Login page
3. **Enter**: Email and password
4. **Click**: "Sign In"
5. **Redirected to**: Admin Dashboard
6. **Can access**: Landing Pages, Careers, Analytics sections

## 🔗 Related Documentation

- `CREATE_FIRST_ADMIN.md` - Create admin user
- `PHASE2_COMPLETE.md` - Frontend setup
- `SETUP_ADMIN_SUBDOMAIN.md` - Production DNS setup
- `ENV_VARIABLES_SETUP.md` - Environment configuration

---

**Quick Access**: `http://admin.contrezz.local:5173` (after setting up `/etc/hosts`)
