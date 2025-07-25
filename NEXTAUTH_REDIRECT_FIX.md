# NextAuth Redirect URI Fix

## 🚨 Error: redirect_uri_mismatch

**Problem**: After migrating to NextAuth, the redirect URI pattern changed.

## ✅ Solution

### Update Google Cloud Console Redirect URIs:

#### **OLD (Custom OAuth):**
```
❌ https://gads-api.vercel.app/api/auth/google/callback
❌ http://localhost:3000/api/auth/google/callback
```

#### **NEW (NextAuth):**
```
✅ https://gads-api.vercel.app/api/auth/callback/google
✅ http://localhost:3000/api/auth/callback/google
```

### Steps:
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to **APIs & Services** > **Credentials**
3. Click your OAuth 2.0 Client ID
4. Update **Authorized redirect URIs** with the new NextAuth pattern
5. Save changes
6. Wait 5-10 minutes for propagation
7. Test login again

### NextAuth Pattern:
- Format: `/api/auth/callback/[provider]`
- For Google: `/api/auth/callback/google`

### Keep JavaScript Origins unchanged:
```
✅ https://gads-api.vercel.app
✅ http://localhost:3000
```