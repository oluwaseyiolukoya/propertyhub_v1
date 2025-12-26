# DigitalOcean Spaces Credentials Setup

## 📍 Location

Add your DigitalOcean Spaces credentials to the `.env` file in the `public-backend` directory:

```
/Users/oluwaseyio/test_ui_figma_and_cursor/public-backend/.env
```

## 🔑 Required Environment Variables

Add the following variables to your `.env` file:

```env
# DigitalOcean Spaces Configuration
DO_SPACES_ACCESS_KEY_ID=your_access_key_here
DO_SPACES_SECRET_ACCESS_KEY=your_secret_key_here
DO_SPACES_BUCKET=contrezz-uploads
DO_SPACES_REGION=nyc3
DO_SPACES_ENDPOINT=https://nyc3.digitaloceanspaces.com
```

### Alternative Variable Names (also supported)

The code also supports these alternative variable names:

```env
# Alternative naming (also works)
SPACES_ACCESS_KEY_ID=your_access_key_here
SPACES_SECRET_ACCESS_KEY=your_secret_key_here
SPACES_BUCKET=contrezz-uploads
SPACES_REGION=nyc3
SPACES_ENDPOINT=https://nyc3.digitaloceanspaces.com
```

### Optional Variables

```env
# Optional: CDN URL if you have a CDN configured
DO_SPACES_CDN_URL=https://your-cdn-url.com
```

## 📝 How to Get Your Credentials

1. **Log in to DigitalOcean**: Go to https://cloud.digitalocean.com
2. **Navigate to Spaces**: Click on "Spaces" in the left sidebar
3. **Create or Select a Space**:
   - If you don't have one, create a new Space named `contrezz-uploads`
   - Note the region (e.g., `nyc3`, `sfo3`, `ams3`)
4. **Get Access Keys**:
   - Go to "API" → "Spaces Keys" in the left sidebar
   - Click "Generate New Key"
   - Give it a name (e.g., "contrezz-public-backend")
   - Copy the **Access Key** and **Secret Key**
   - ⚠️ **Important**: The secret key is only shown once! Save it immediately.

## ✅ Example .env File

Here's what your `.env` file should look like (add these lines):

```env
# Database
PUBLIC_DATABASE_URL=postgresql://user:password@localhost:5432/contrezz_public

# DigitalOcean Spaces
DO_SPACES_ACCESS_KEY_ID=your_access_key_here
DO_SPACES_SECRET_ACCESS_KEY=your_secret_key_here
DO_SPACES_BUCKET=contrezz-uploads
DO_SPACES_REGION=nyc3
DO_SPACES_ENDPOINT=https://nyc3.digitaloceanspaces.com

# Other variables...
PORT=5001
NODE_ENV=development
```

## 🔒 Security Notes

- ⚠️ **Never commit `.env` to git** - it's already in `.gitignore`
- ⚠️ **Never share your secret key** - treat it like a password
- ✅ The `.env` file is local only and won't be pushed to the repository

## 🧪 Testing

After adding the credentials:

1. **Restart the backend server** (if it's running):

   ```bash
   cd public-backend
   npm run dev
   ```

2. **Check the console** - you should see:

   ```
   ✅ Public Storage Service initialized
      Endpoint: https://nyc3.digitaloceanspaces.com
      Bucket: contrezz-uploads
      CDN: Not configured
   ```

3. **Try uploading a resume** - the upload should now work!

## 🐛 Troubleshooting

If you see errors:

1. **Check credentials are correct**: Verify the access key and secret key are correct
2. **Check bucket name**: Make sure the bucket exists and the name matches
3. **Check region**: Ensure the region matches your Space's region
4. **Check endpoint**: Should be `https://{region}.digitaloceanspaces.com`
5. **Restart server**: After changing `.env`, always restart the server

## 📚 Related Files

- Storage service: `public-backend/src/services/storage.service.ts`
- Main entry: `public-backend/src/index.ts` (loads .env via `dotenv.config()`)
