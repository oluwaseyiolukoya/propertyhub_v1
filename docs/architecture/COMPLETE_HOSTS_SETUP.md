# Complete /etc/hosts Setup for Local Development

## 📋 Recommended /etc/hosts Configuration

For complete local development with all domains, add these entries to `/etc/hosts`:

```
127.0.0.1       localhost
127.0.0.1       contrezz.local
127.0.0.1       app.contrezz.local
127.0.0.1       admin.contrezz.local
```

## 🎯 Domain Mapping

| Domain                 | Purpose                     | Access URL                         |
| ---------------------- | --------------------------- | ---------------------------------- |
| `contrezz.local`       | Public landing page         | `http://contrezz.local:5173`       |
| `app.contrezz.local`   | Application login/dashboard | `http://app.contrezz.local:5173`   |
| `admin.contrezz.local` | Public admin interface      | `http://admin.contrezz.local:5173` |

## 📝 How to Edit /etc/hosts

### macOS/Linux

1. Open terminal
2. Edit the file:
   ```bash
   sudo nano /etc/hosts
   ```
3. Add the entries above
4. Save: `Ctrl+X`, then `Y`, then `Enter`
5. Flush DNS cache:
   ```bash
   sudo dscacheutil -flushcache  # macOS
   sudo systemd-resolve --flush-caches  # Linux
   ```

### Windows

1. Open Notepad as Administrator
2. Navigate to: `C:\Windows\System32\drivers\etc\hosts`
3. Add the entries above
4. Save
5. Flush DNS cache:
   ```bash
   ipconfig /flushdns
   ```

## ✅ Current Status

Based on your `/etc/hosts` file:

- ✅ `admin.contrezz.local` - Already configured (Line 13)
- ⏳ `contrezz.local` - Optional (for public landing page)
- ⏳ `app.contrezz.local` - Optional (for app domain)

## 🚀 Quick Access

With your current setup, you can access:

```
http://admin.contrezz.local:5173
```

This will show the Public Admin login page.

## 🔧 Testing All Domains

If you want to test the complete domain-based routing:

1. Add the optional entries to `/etc/hosts`
2. Start frontend: `npm run dev`
3. Test each domain:
   - `http://contrezz.local:5173` → Public landing page
   - `http://app.contrezz.local:5173` → App login
   - `http://admin.contrezz.local:5173` → Public admin login

## 📖 Related Documentation

- `ACCESS_PUBLIC_ADMIN.md` - How to access admin interface
- `SETUP_ADMIN_SUBDOMAIN.md` - Production DNS setup

---

**Your current setup is ready!** You can access the admin at `http://admin.contrezz.local:5173`
