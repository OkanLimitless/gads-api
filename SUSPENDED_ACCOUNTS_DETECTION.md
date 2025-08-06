# 🚨 Suspended Accounts Detection Tool

## Overview

The Suspended Accounts Detection tool helps you identify and manage suspended or canceled client accounts within your Google Ads MCC (My Client Center). This is particularly useful when Google Ads UI has issues unlinking accounts, providing an alternative method to clean up your MCC structure.

## Features

### 🔍 **Detection Capabilities**
- **Automatic Scanning**: Scans your MCC for client accounts with "SUSPENDED" or "CANCELED" status
- **Detailed Information**: Provides account details including name, ID, currency, timezone, and suspension reason
- **Performance Insights**: Attempts to fetch additional account details where permissions allow
- **Real-time Status**: Shows current suspension status and detection timestamp

### 🧹 **Management Features**
- **Bulk Selection**: Select multiple suspended accounts for batch operations
- **Individual Selection**: Choose specific accounts to unlink
- **Batch Unlinking**: Unlink multiple suspended accounts simultaneously
- **Success Tracking**: Visual feedback showing which accounts were successfully unlinked
- **Error Handling**: Clear error messages and retry options

### 📊 **Summary Dashboard**
- **Count Overview**: Total suspended accounts, broken down by suspension type
- **Recommendations**: AI-generated suggestions for account management
- **Historical Tracking**: Timestamps for detection and actions taken

## How to Access

### Method 1: From Dashboard
1. **Navigate to Dashboard** - Sign in and go to your main dashboard
2. **Select MCC Account** - Choose the MCC account you want to scan
3. **Use Quick Actions** - Click "Check Suspended" button on any MCC card
4. **Or Use Management Tools** - Scroll to "MCC Management Tools" section and click "Detect Suspended"

### Method 2: Direct URL
- Navigate directly to `/suspended-accounts?mccId=YOUR_MCC_ID&mccName=YOUR_MCC_NAME`
- Replace `YOUR_MCC_ID` with your actual MCC customer ID

## Step-by-Step Usage

### 1. **Detection Phase**
```
🔍 The tool automatically scans your MCC for suspended accounts
⏳ Wait for the scanning process to complete
📊 Review the summary showing total suspended accounts
```

### 2. **Analysis Phase**
```
📋 Review the list of detected suspended accounts
🔍 Check account details, status, and suspension reasons
💡 Read the AI recommendation for next steps
```

### 3. **Action Phase**
```
☑️ Select accounts you want to unlink (individual or bulk selection)
🚨 Review the warning about permanent unlinking
✅ Click "Unlink Selected" to perform the action
🎉 Confirm successful unlinking with visual feedback
```

## Technical Details

### API Endpoints
- **Detection**: `GET /api/mcc-clients/suspended?mccId={mccId}`
- **Unlinking**: `POST /api/mcc-clients/unlink` (reuses existing endpoint)

### Account Status Detection
The tool detects accounts with these statuses:
- `SUSPENDED` - Account has been suspended by Google
- `CANCELED` - Account has been canceled/closed

### Google Ads API Integration
```javascript
// Query for suspended accounts
const clientsQuery = `
  SELECT 
    customer_client.client_customer,
    customer_client.descriptive_name,
    customer_client.status,
    // ... other fields
  FROM customer_client
  WHERE customer_client.level = 1
  AND customer_client.manager = false
  AND (customer_client.status = 'SUSPENDED' OR customer_client.status = 'CANCELED')
`
```

## Benefits

### 🚀 **Efficiency Improvements**
- **Automated Detection**: No manual searching through Google Ads UI
- **Bulk Operations**: Handle multiple accounts at once
- **Alternative Access**: Works when Google Ads UI has unlinking issues
- **Time Savings**: Streamlined process vs. manual account management

### 🧹 **MCC Organization**
- **Clean Structure**: Remove inactive accounts cluttering your MCC
- **Better Performance**: Improved MCC loading and navigation
- **Easier Management**: Focus on active, revenue-generating accounts
- **Compliance**: Maintain organized account hierarchy

### 📈 **Business Value**
- **Resource Optimization**: Focus efforts on active accounts
- **Improved Visibility**: Cleaner account lists for better decision-making
- **Risk Management**: Remove potential compliance issues from suspended accounts
- **Scalability**: Handle large MCCs with hundreds of client accounts

## Important Warnings

### ⚠️ **Permanent Action**
- **Irreversible**: Unlinking removes accounts from your MCC permanently
- **Access Loss**: You will lose management access to unlinked accounts
- **Campaign Impact**: Ensure no active campaigns exist before unlinking
- **Data Preservation**: Historical data may still be accessible in Google Ads

### 🔒 **Permission Requirements**
- **MCC Access**: Requires proper MCC management permissions
- **API Authorization**: Valid Google Ads API access with appropriate scopes
- **Account Permissions**: Some suspended accounts may have limited data access

## Troubleshooting

### Common Issues
1. **"Authentication required"**: Re-authenticate with Google Ads
2. **"MCC ID is required"**: Ensure you're accessing from a valid MCC context
3. **"No suspended accounts found"**: Your MCC is clean - no action needed!
4. **API errors**: Check Google Ads API quotas and permissions

### Error Recovery
- **Retry Detection**: Use the "Refresh" button to re-scan
- **Partial Failures**: Individual account unlink failures are tracked and reported
- **Network Issues**: Automatic retry mechanisms for transient failures

## Best Practices

### 🎯 **Before Unlinking**
1. **Verify Status**: Confirm accounts are truly suspended and not temporarily disabled
2. **Check Dependencies**: Ensure no shared assets or campaigns depend on these accounts
3. **Document Changes**: Keep records of which accounts were unlinked and when
4. **Client Communication**: Inform clients if you're unlinking their suspended accounts

### 📅 **Regular Maintenance**
- **Monthly Scans**: Run detection monthly to keep MCC clean
- **Post-Campaign Reviews**: Check for suspended accounts after major campaign changes
- **Client Onboarding**: Scan when adding new client accounts to identify issues early

## Related Tools

- **Account Unlink Manager**: `/unlink-accounts` - Unlink any accounts (not just suspended)
- **MCC Client Overview**: `/api/mcc-clients/all` - View all client accounts
- **Dashboard**: Main entry point for all MCC management tools

---

**Built for AdGenius Pro** - AI-Powered Google Ads Management Platform

This tool provides a reliable alternative when Google Ads UI has issues with account unlinking, ensuring you can maintain a clean and efficient MCC structure regardless of platform limitations.