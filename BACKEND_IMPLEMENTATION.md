# Backend Implementation - Persistent Authentication & MCC Support

## Overview

This document outlines the backend implementation changes made to support:

1. **Persistent Google Authentication** using NextAuth.js
2. **Enhanced MCC (Manager Customer Center) Account Handling**

## Key Changes Made

### 1. NextAuth.js Integration

#### Files Added/Modified:
- `app/api/auth/[...nextauth]/route.ts` - NextAuth configuration
- `types/next-auth.d.ts` - TypeScript type extensions
- `components/AuthProvider.tsx` - Client-side session provider
- `app/layout.tsx` - Root layout with AuthProvider

#### Features:
- **Persistent Sessions**: User stays logged in across browser sessions
- **Automatic Token Refresh**: Handles expired access tokens automatically
- **Secure Token Storage**: Tokens stored in secure HTTP-only cookies
- **Proper OAuth Flow**: Handles consent, offline access, and refresh tokens

#### Configuration:
```typescript
// NextAuth configuration with Google provider
GoogleProvider({
  clientId: process.env.GOOGLE_ADS_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_ADS_CLIENT_SECRET!,
  authorization: {
    params: {
      scope: 'https://www.googleapis.com/auth/adwords openid email profile',
      access_type: 'offline',
      prompt: 'consent',
      include_granted_scopes: 'true',
    },
  },
})
```

### 2. Enhanced MCC Account Support

#### Files Modified:
- `lib/google-ads-client.ts` - Enhanced account fetching
- `app/api/accounts/route.ts` - Improved account API

#### New Account Interface:
```typescript
interface AdAccount {
  id: string
  name: string
  currency: string
  timeZone: string
  status: string
  canManageCampaigns: boolean
  testAccount: boolean
  isManager: boolean              // NEW: Identifies MCC accounts
  managerCustomerId?: string      // NEW: Parent manager ID
  level: number                   // NEW: Hierarchy level
  accountType: 'MCC' | 'CLIENT' | 'UNKNOWN'  // NEW: Account type
}
```

#### MCC Features:
- **Hierarchy Detection**: Identifies manager-client relationships
- **Account Sorting**: MCC accounts first, then client accounts
- **Campaign Restrictions**: Prevents campaign management on MCC accounts
- **Account Statistics**: Shows total, manager, and client account counts

### 3. API Route Updates

#### Authentication Changes:
All API routes now use NextAuth sessions instead of URL parameters:

```typescript
// Before (insecure)
const refreshToken = searchParams.get('refresh_token')

// After (secure)
const session = await getServerSession(authOptions)
if (!session?.refreshToken) {
  return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
}
```

#### Updated Routes:
- `app/api/accounts/route.ts` - Uses session authentication
- `app/api/campaigns/route.ts` - Uses session authentication  
- `app/api/performance/route.ts` - Uses session authentication
- `app/api/auth/status/route.ts` - New endpoint for auth status

### 4. Frontend Integration

#### Dashboard Updates (`app/dashboard/page.tsx`):
- **NextAuth Hooks**: Uses `useSession`, `signIn`, `signOut`
- **Account Selection UI**: Enhanced with MCC/Client indicators
- **Authentication Status**: Shows connected user information
- **Automatic Fallback**: Falls back to demo data when not authenticated

#### Key Features:
- **Visual Account Hierarchy**: MCC accounts marked with badges
- **Campaign Restrictions**: Disables campaign management for MCC accounts
- **Account Statistics**: Shows breakdown of account types
- **Persistent State**: Maintains authentication across page refreshes

## Security Improvements

### Before:
- Tokens passed in URL parameters (visible in logs, browser history)
- No persistent authentication (login required each session)
- No token refresh handling
- Vulnerable to CSRF attacks

### After:
- Tokens stored in secure HTTP-only cookies
- Persistent authentication with automatic session management
- Automatic token refresh handling
- CSRF protection built-in with NextAuth
- Proper OAuth scope management

## MCC Account Handling

### Account Discovery:
1. **List Accessible Customers**: Gets all accounts user can access
2. **Fetch Customer Details**: Gets detailed info for each account
3. **Determine Hierarchy**: Identifies manager-client relationships
4. **Sort Accounts**: Orders by type (MCC first) then by name

### Account Types:
- **MCC (Manager)**: Cannot manage campaigns directly, used for account management
- **CLIENT**: Can manage campaigns, ads, keywords
- **UNKNOWN**: Fallback for accounts with undetermined status

### UI Indicators:
- **Purple "MCC" Badge**: Identifies manager accounts
- **Orange "Test" Badge**: Identifies test accounts
- **Disabled State**: MCC accounts cannot be selected for campaign management
- **Account Stats**: Shows total accounts and breakdown by type

## Environment Variables Required

```bash
# Google Ads API
GOOGLE_ADS_CLIENT_ID=your_client_id
GOOGLE_ADS_CLIENT_SECRET=your_client_secret
GOOGLE_ADS_DEVELOPER_TOKEN=your_developer_token

# NextAuth
NEXTAUTH_SECRET=your_random_secret_key
NEXTAUTH_URL=http://localhost:3000  # For development

# Optional: Custom redirect URI
GOOGLE_ADS_REDIRECT_URI=your_custom_redirect_uri
```

## API Endpoints

### Authentication:
- `GET /api/auth/[...nextauth]` - NextAuth endpoints (signin, callback, etc.)
- `GET /api/auth/status` - Check authentication status

### Google Ads:
- `GET /api/accounts` - List accessible accounts (requires auth)
- `GET /api/campaigns?customerId=X` - List campaigns (session-based auth)
- `GET /api/performance?customerId=X` - Get performance data (session-based auth)

## Benefits

### For Users:
1. **Persistent Login**: No need to re-authenticate each session
2. **Better UX**: Clear account hierarchy and restrictions
3. **Automatic Refresh**: Seamless token renewal
4. **Secure**: No tokens exposed in URLs

### For Developers:
1. **Maintainable**: Standard NextAuth patterns
2. **Secure**: Built-in security best practices
3. **Scalable**: Easy to extend with additional providers
4. **Debuggable**: Better error handling and logging

## Testing

### Authentication Flow:
1. Visit `/dashboard`
2. Click "Connect Google Ads"
3. Complete OAuth flow
4. Should see persistent login across browser sessions

### MCC Account Handling:
1. Login with account that has MCC access
2. Should see both manager and client accounts
3. MCC accounts should be marked and non-selectable
4. Client accounts should be selectable for campaign management

## Migration Notes

### From Old System:
- Remove URL parameter token passing
- Update frontend to use NextAuth hooks
- Update API calls to rely on session cookies
- Test OAuth flow thoroughly

### Environment Setup:
- Ensure `NEXTAUTH_SECRET` is set
- Verify Google OAuth redirect URIs include NextAuth callback
- Test both development and production environments

## Future Enhancements

1. **Database Integration**: Store additional user/account metadata
2. **Role-Based Access**: Different permissions for different users
3. **Multi-Provider Auth**: Support additional OAuth providers
4. **Account Switching**: Quick switching between multiple Google accounts
5. **Advanced MCC Features**: Bulk operations across client accounts