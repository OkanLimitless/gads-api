# 🔐 Google Ads OAuth Setup Guide

Follow this step-by-step guide to configure OAuth 2.0 for Google Ads API access.

## 🚨 **Quick Fix for "invalid_request" Error**

If you're seeing the error:
```
Fout 400: invalid_request
Details van verzoek: redirect_uri=gads-rbvflyqw7-johns-projects-b489a0ec.vercel.app/api/auth/google/callback
```

**The issue**: The redirect URI is missing `https://` protocol.

**The fix**: Add these exact URLs to your Google Cloud Console:

### **✅ Correct URLs for Your Vercel Deployment:**

**Authorized JavaScript Origins:**
```
https://gads-rbvflyqw7-johns-projects-b489a0ec.vercel.app
http://localhost:3000
```

**Authorized Redirect URIs:**
```
https://gads-rbvflyqw7-johns-projects-b489a0ec.vercel.app/api/auth/google/callback
http://localhost:3000/api/auth/google/callback
```

---

## 📋 **Step 1: Google Cloud Console Setup**

### 1.1 Create or Select Project
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select an existing one
3. Make sure billing is enabled (required for Google Ads API)

### 1.2 Enable Google Ads API
1. Go to **APIs & Services** > **Library**
2. Search for "Google Ads API"
3. Click on "Google Ads API" and click **Enable**

### 1.3 Create OAuth 2.0 Credentials
1. Go to **APIs & Services** > **Credentials**
2. Click **+ CREATE CREDENTIALS** > **OAuth client ID**
3. If prompted, configure the OAuth consent screen first (see Step 2)
4. Select **Web application** as the application type
5. Give it a name (e.g., "AdGenius Pro OAuth")

## 🌐 **Step 2: Configure OAuth URLs**

### 2.1 Authorized JavaScript Origins
Add these URLs to **Authorized JavaScript origins**:

**For Your Current Deployment:**
```
https://gads-rbvflyqw7-johns-projects-b489a0ec.vercel.app
```

**For Development:**
```
http://localhost:3000
```

**For Custom Domain (if you have one):**
```
https://your-custom-domain.com
```

### 2.2 Authorized Redirect URIs
Add these URLs to **Authorized redirect URIs**:

**For Your Current Deployment:**
```
https://gads-rbvflyqw7-johns-projects-b489a0ec.vercel.app/api/auth/google/callback
```

**For Development:**
```
http://localhost:3000/api/auth/google/callback
```

**For Custom Domain (if you have one):**
```
https://your-custom-domain.com/api/auth/google/callback
```

## 🛡️ **Step 3: OAuth Consent Screen**

### 3.1 Basic Information
- **App name**: AdGenius Pro
- **User support email**: Your email
- **App logo**: Upload your company logo (optional)
- **App domain**: `https://gads-rbvflyqw7-johns-projects-b489a0ec.vercel.app`
- **Authorized domains**: `gads-rbvflyqw7-johns-projects-b489a0ec.vercel.app`
- **Developer contact information**: Your email

### 3.2 Scopes
Add the following scope:
- `https://www.googleapis.com/auth/adwords`

### 3.3 Test Users (for development)
Add test user email addresses that can access your app during development.

## 🔑 **Step 4: Get Your Credentials**

After creating the OAuth client, you'll get:
- **Client ID**: Something like `123456789-abc123.apps.googleusercontent.com`
- **Client Secret**: A long string like `GOCSPX-abc123def456`

## ⚙️ **Step 5: Configure Environment Variables**

### 5.1 Local Development (.env.local)
```env
# Google Ads API Configuration
GOOGLE_ADS_DEVELOPER_TOKEN=PhK1VZetIe4qsZh8y51Sug
GOOGLE_ADS_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
GOOGLE_ADS_CLIENT_SECRET=GOCSPX-your-client-secret-here

# NextAuth Configuration (for local development)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-random-secret-key-here
```

### 5.2 Production (Vercel)
In your Vercel dashboard, add these environment variables:
```env
GOOGLE_ADS_DEVELOPER_TOKEN=PhK1VZetIe4qsZh8y51Sug
GOOGLE_ADS_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
GOOGLE_ADS_CLIENT_SECRET=GOCSPX-your-client-secret-here

# Vercel automatically sets VERCEL_URL, so you don't need to set NEXTAUTH_URL
# But you can set it explicitly if needed:
# NEXTAUTH_URL=https://gads-rbvflyqw7-johns-projects-b489a0ec.vercel.app

NEXTAUTH_SECRET=your-random-secret-key-here
```

## 🧪 **Step 6: Test the OAuth Flow**

### 6.1 Testing Your Current Deployment
1. Go to `https://gads-rbvflyqw7-johns-projects-b489a0ec.vercel.app/dashboard`
2. Click "Connect Google Ads"
3. Complete the OAuth flow
4. Check for any error messages

### 6.2 Common Issues & Solutions

**Issue**: `redirect_uri_mismatch` or `invalid_request`
- **Solution**: Make sure the redirect URI in Google Cloud Console exactly matches what your app is sending
- **Check**: The URLs must include `https://` for production and `http://` for localhost

**Issue**: `access_denied`
- **Solution**: User declined access or your app isn't approved for production use

**Issue**: `invalid_client`
- **Solution**: Check your Client ID and Client Secret are correct

**Issue**: No refresh token received
- **Solution**: Make sure `prompt=consent` is included in the OAuth URL

**Issue**: URLs without protocol
- **Solution**: Vercel URLs are automatically served over HTTPS, make sure all URLs start with `https://`

## 📝 **Step 7: Google Ads API Developer Token**

### 7.1 Apply for Developer Token
1. Go to [Google Ads API Center](https://developers.google.com/google-ads/api/docs/first-call/dev-token)
2. Sign in with your Google Ads account
3. Apply for a developer token
4. Provide your application details and use case

### 7.2 Token Approval Process
- **Test Token**: You'll get a test token immediately for testing
- **Production Token**: Requires review and approval (can take several days)
- **Basic Access**: For managing your own accounts
- **Standard Access**: For managing client accounts (requires additional approval)

## 🔒 **Security Best Practices**

### 8.1 Environment Variables
- Never commit credentials to version control
- Use different credentials for development and production
- Regularly rotate your client secrets

### 8.2 OAuth Scopes
- Only request the minimum scopes needed
- `https://www.googleapis.com/auth/adwords` gives full Google Ads access

### 8.3 Token Storage
- In production, store refresh tokens securely in a database
- Never expose tokens in client-side code
- Implement token refresh logic

## 🚀 **Step 8: Production Deployment**

### 8.1 Update OAuth Settings
1. Add your production domain to Google Cloud Console
2. Update redirect URIs with your production URLs
3. Set environment variables in your hosting platform

### 8.2 SSL Certificate
- Ensure your production domain has a valid SSL certificate
- Google requires HTTPS for OAuth redirects in production
- Vercel automatically provides SSL certificates

### 8.3 Domain Verification
- Verify ownership of your domain in Google Cloud Console
- This may be required for OAuth consent screen approval

## 🎯 **Testing Your Setup**

Use this checklist to verify everything is working:

- [ ] Google Cloud project created with billing enabled
- [ ] Google Ads API enabled
- [ ] OAuth 2.0 credentials created
- [ ] Authorized JavaScript origins configured with `https://` protocol
- [ ] Authorized redirect URIs configured with `https://` protocol
- [ ] OAuth consent screen configured
- [ ] Environment variables set correctly in Vercel
- [ ] OAuth flow completes successfully
- [ ] Refresh token is received
- [ ] Google Ads accounts can be fetched

## 📞 **Need Help?**

If you encounter issues:
1. Check the browser developer console for errors
2. Check your Vercel function logs for detailed error messages
3. Verify all URLs match exactly between your app and Google Cloud Console
4. Make sure all production URLs use `https://` protocol
5. Make sure your Google Ads account has the necessary permissions

## 🔧 **Debugging Tips**

### Check Your Current Vercel URL
Your app is currently deployed at:
```
https://gads-rbvflyqw7-johns-projects-b489a0ec.vercel.app
```

### Verify OAuth URLs in Console
Check that these exact URLs are in your Google Cloud Console:
- **JavaScript Origins**: `https://gads-rbvflyqw7-johns-projects-b489a0ec.vercel.app`
- **Redirect URIs**: `https://gads-rbvflyqw7-johns-projects-b489a0ec.vercel.app/api/auth/google/callback`

---

**Ready to test?** Go to your dashboard and click "Connect Google Ads" to start the OAuth flow!