# 🔐 Google Ads OAuth Setup Guide

Follow this step-by-step guide to configure OAuth 2.0 for Google Ads API access.

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

**For Development:**
```
http://localhost:3000
```

**For Production (replace with your actual domain):**
```
https://your-app-name.vercel.app
https://your-custom-domain.com
```

### 2.2 Authorized Redirect URIs
Add these URLs to **Authorized redirect URIs**:

**For Development:**
```
http://localhost:3000/api/auth/google/callback
```

**For Production (replace with your actual domain):**
```
https://your-app-name.vercel.app/api/auth/google/callback
https://your-custom-domain.com/api/auth/google/callback
```

## 🛡️ **Step 3: OAuth Consent Screen**

### 3.1 Basic Information
- **App name**: AdGenius Pro
- **User support email**: Your email
- **App logo**: Upload your company logo (optional)
- **App domain**: Your website domain
- **Authorized domains**: Add your domain(s)
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
GOOGLE_ADS_REDIRECT_URI=http://localhost:3000/api/auth/google/callback

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-random-secret-key-here
```

### 5.2 Production (Vercel)
In your Vercel dashboard, add these environment variables:
```env
GOOGLE_ADS_DEVELOPER_TOKEN=PhK1VZetIe4qsZh8y51Sug
GOOGLE_ADS_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
GOOGLE_ADS_CLIENT_SECRET=GOCSPX-your-client-secret-here
GOOGLE_ADS_REDIRECT_URI=https://your-domain.com/api/auth/google/callback
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-random-secret-key-here
```

## 🧪 **Step 6: Test the OAuth Flow**

### 6.1 Development Testing
1. Start your development server: `npm run dev`
2. Go to `http://localhost:3000/dashboard`
3. Click "Connect Google Ads"
4. Complete the OAuth flow
5. Check for any error messages

### 6.2 Common Issues & Solutions

**Issue**: `redirect_uri_mismatch`
- **Solution**: Make sure the redirect URI in Google Cloud Console exactly matches what your app is sending

**Issue**: `access_denied`
- **Solution**: User declined access or your app isn't approved for production use

**Issue**: `invalid_client`
- **Solution**: Check your Client ID and Client Secret are correct

**Issue**: No refresh token received
- **Solution**: Make sure `prompt=consent` is included in the OAuth URL

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

### 8.3 Domain Verification
- Verify ownership of your domain in Google Cloud Console
- This may be required for OAuth consent screen approval

## 🎯 **Testing Your Setup**

Use this checklist to verify everything is working:

- [ ] Google Cloud project created with billing enabled
- [ ] Google Ads API enabled
- [ ] OAuth 2.0 credentials created
- [ ] Authorized JavaScript origins configured
- [ ] Authorized redirect URIs configured
- [ ] OAuth consent screen configured
- [ ] Environment variables set correctly
- [ ] OAuth flow completes successfully
- [ ] Refresh token is received
- [ ] Google Ads accounts can be fetched

## 📞 **Need Help?**

If you encounter issues:
1. Check the browser developer console for errors
2. Check your server logs for detailed error messages
3. Verify all URLs match exactly between your app and Google Cloud Console
4. Make sure your Google Ads account has the necessary permissions

---

**Ready to test?** Go to your dashboard and click "Connect Google Ads" to start the OAuth flow!