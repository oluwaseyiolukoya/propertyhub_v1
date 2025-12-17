# Verify Password Hash in Database

## Check Current Hash in Database

**In PostgreSQL, run:**

```sql
SELECT email, password FROM public_admins WHERE email = 'admin@contrezz.com';
```

This will show the current password hash in the database.

## Verify Hash Matches Password

**On your local machine (in terminal, NOT in psql):**

```bash
cd public-backend
node -e "const bcrypt = require('bcryptjs'); bcrypt.compare('Korede@1988', 'PASTE_HASH_FROM_DB').then(result => console.log('Password matches:', result));"
```

Replace `PASTE_HASH_FROM_DB` with the hash from the database.

**If it returns `true`:** Hash is correct, password should work.

**If it returns `false`:** Hash doesn't match, need to update.

## Update Password Hash

**If hash doesn't match, update it:**

1. **Generate new hash:**

   ```bash
   cd public-backend
   node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('Korede@1988', 10).then(hash => console.log(hash));"
   ```

2. **Copy the hash**

3. **Update in database:**
   ```sql
   UPDATE public_admins
   SET password = '$2b$10$NEW_HASH_HERE'
   WHERE email = 'admin@contrezz.com';
   ```

## Current Correct Hash

**The hash we just set (should be in database now):**

```
$2b$10$HkDZSw.RcLJAkyCVBf0fU.nI9PvsE7yyPgrlfG3Ay/.WvJZ0XLUzW
```

**Verify it matches:**

```bash
cd public-backend
node -e "const bcrypt = require('bcryptjs'); bcrypt.compare('Korede@1988', '$2b$10$HkDZSw.RcLJAkyCVBf0fU.nI9PvsE7yyPgrlfG3Ay/.WvJZ0XLUzW').then(result => console.log('Matches:', result));"
```

Should return: `Matches: true`

---

**Last Updated:** December 16, 2025

