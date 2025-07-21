# AdGenius Creator - Deployment Guide

This guide will help you deploy AdGenius Creator to Vercel and connect it to the Google Ads API.

## Prerequisites

- GitHub account
- Vercel account (sign up at [vercel.com](https://vercel.com))
- Google Cloud Console access
- Google Ads account with API access

## Step 1: Prepare Your Repository

1. **Initialize Git and push to GitHub:**
```bash
git init
git add .
git commit -m "Initial commit: AdGenius Creator"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/adgenius-creator.git
git push -u origin main
```

## Step 2: Deploy to Vercel

### Option A: Via Vercel Dashboard
1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "New Project"
3. Import your GitHub repository
4. Vercel will automatically detect it's a Next.js project
5. Click "Deploy"

### Option B: Via Vercel CLI
```bash
npm i -g vercel
vercel --prod
```

## Step 3: Configure Environment Variables in Vercel

1. Go to your project dashboard on Vercel
2. Navigate to "Settings" → "Environment Variables"
3. Add the following variables:

| Name | Value | Description |
|------|-------|-------------|
| `GOOGLE_ADS_DEVELOPER_TOKEN` | `PhK1VZetIe4qsZh8y51Sug` | Your provided test token |
| `GOOGLE_ADS_CLIENT_ID` | `your_client_id` | OAuth 2.0 Client ID |
| `GOOGLE_ADS_CLIENT_SECRET` | `your_client_secret` | OAuth 2.0 Client Secret |
| `GOOGLE_ADS_REFRESH_TOKEN` | `your_refresh_token` | OAuth 2.0 Refresh Token |

## Step 4: Google Ads API Setup (For Production)

### 4.1 Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing one
3. Enable the Google Ads API:
   - Go to "APIs & Services" → "Library"
   - Search for "Google Ads API"
   - Click "Enable"

### 4.2 Create OAuth 2.0 Credentials
1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth 2.0 Client ID"
3. Configure consent screen if prompted
4. Set Application Type to "Web application"
5. Add authorized redirect URIs:
   - `http://localhost:3000` (for development)
   - `https://your-app.vercel.app` (for production)
6. Save the Client ID and Client Secret

### 4.3 Generate Refresh Token
Use Google OAuth 2.0 Playground or create a custom flow:

1. Go to [OAuth 2.0 Playground](https://developers.google.com/oauthplayground/)
2. Click settings gear → Check "Use your own OAuth credentials"
3. Enter your Client ID and Client Secret
4. In Step 1, add scope: `https://www.googleapis.com/auth/adwords`
5. Click "Authorize APIs"
6. Complete authorization flow
7. In Step 2, click "Exchange authorization code for tokens"
8. Copy the refresh token

### 4.4 Apply for Google Ads API Access
1. Go to [Google Ads API Center](https://developers.google.com/google-ads/api)
2. Apply for a developer token
3. This process can take several days to weeks
4. You'll need to provide:
   - Business information
   - Intended use case
   - Demo of your application

## Step 5: Update Code for Production

For production use, you'll need to install the actual Google Ads API library:

```bash
npm install google-ads-api
```

Then update `lib/google-ads.ts` to use real API calls instead of mock data.

## Step 6: Testing Your Deployment

1. Visit your Vercel URL
2. The app should load with demo data
3. Test creating campaigns, ad groups, and keywords
4. Verify all functionality works as expected

## Step 7: Custom Domain (Optional)

1. In Vercel dashboard, go to "Settings" → "Domains"
2. Add your custom domain
3. Configure DNS settings as instructed
4. SSL certificate will be automatically provisioned

## Demo Mode vs Production Mode

### Demo Mode (Current)
- Uses mock data for all operations
- No real Google Ads API calls
- Perfect for testing and demonstration
- Immediate deployment possible

### Production Mode (After API Approval)
- Requires actual Google Ads API credentials
- Real campaign management
- Requires developer token approval
- Full OAuth 2.0 flow implementation

## Troubleshooting

### Build Errors
- Check that all dependencies are correctly installed
- Verify TypeScript types are correct
- Ensure environment variables are set

### API Errors
- Verify Google Ads API credentials are correct
- Check that the developer token is approved
- Ensure OAuth 2.0 flow is properly implemented

### Deployment Issues
- Check Vercel build logs for errors
- Verify environment variables are set in Vercel
- Ensure no build-time dependencies are missing

## Security Considerations

1. **Never commit API credentials to Git**
2. **Use environment variables for all sensitive data**
3. **Implement proper OAuth 2.0 flow for production**
4. **Regularly rotate API credentials**
5. **Monitor API usage and quotas**

## Performance Optimization

1. **Enable caching for API responses**
2. **Implement proper error handling**
3. **Use loading states for better UX**
4. **Optimize images and assets**
5. **Monitor Core Web Vitals**

## Monitoring and Analytics

Consider adding:
- Error tracking (Sentry)
- Analytics (Google Analytics, Mixpanel)
- Performance monitoring (Vercel Analytics)
- API usage monitoring

## Support

- **Vercel Support**: [vercel.com/support](https://vercel.com/support)
- **Google Ads API**: [developers.google.com/google-ads/api/docs/support](https://developers.google.com/google-ads/api/docs/support)
- **Next.js Documentation**: [nextjs.org/docs](https://nextjs.org/docs)

---

Your AdGenius Creator app is now ready for deployment! The current version works perfectly as a demo with mock data, and you can later upgrade it to use real Google Ads API once you receive approval for your developer token.