# 🔗 Account Unlinking with Suspension Detection

## 🎯 Quick Access

**Direct URL to unlink accounts:**
```
/unlink-accounts?mccId=1284928552&mccName=Your%20MCC%20Name
```

Replace `1284928552` with your actual MCC ID.

**✅ FIXED: API now working properly!**
- The `mutate is not a function` error has been resolved
- The `Mutate operations must have create, update, or remove specified` error has been resolved
- Updated to use correct `mutateResources` method matching our existing codebase structure
- Uses the same entity/operation/resource pattern as all other operations
- Ready for production use

## ✨ Features

### 🔍 **Suspended Account Detection**
- **Automatic detection** using `customer_client.status`
- **Visual highlighting** of suspended accounts with red borders
- **Status badges**: ⚠️ SUSPENDED, ✅ ENABLED, TEST (outline)

### 🎛️ **Smart Filtering**
- **All Accounts** - Shows all client accounts
- **⚠️ Suspended** - Shows only suspended/canceled accounts  
- **✅ Enabled** - Shows only active accounts

### 🎯 **Bulk Selection**
- **Select All** - Select all filtered accounts
- **Select All Suspended** - Quickly select all suspended accounts
- **Individual selection** via checkboxes

### 🛡️ **Safe Operation**
- **Two-step confirmation** before unlinking
- **Clear warnings** about the consequences
- **Individual results** showing success/failure for each account

## 🚀 How to Use

### 1. **Navigate to the URL**
```
/unlink-accounts?mccId=YOUR_MCC_ID
```

### 2. **Filter for Suspended Accounts**
- Click the **"⚠️ Suspended"** button to see only suspended accounts

### 3. **Select Accounts to Unlink**
- Click **"Select All Suspended"** for bulk selection
- Or manually check individual accounts

### 4. **Unlink Process**
- Click **"Unlink Accounts"**
- **Confirm** the action in the dialog
- **Review results** - see which accounts were successfully unlinked

## 📊 What You'll See

### Account Cards Show:
- **Account ID and Name**
- **Status badges** (SUSPENDED, ENABLED, TEST)
- **Visual highlighting** for suspended accounts (red borders)
- **Selection checkboxes**

### Results Display:
- ✅ **Success**: Account successfully unlinked
- ❌ **Error**: Specific error message for failed unlinks
- 📊 **Summary**: Total successful vs. failed operations

## 🎯 Perfect for Your Use Case

This is specifically designed for managing **suspended accounts** that need to be unlinked from your MCC. The system will:

1. **Detect all suspended accounts** automatically
2. **Highlight them visually** so you can easily identify them
3. **Allow bulk selection** of all suspended accounts at once
4. **Safely unlink them** with confirmation and detailed results

## 🔧 Technical Details

- **Uses `customer_client.status`** to detect suspension
- **Identifies SUSPENDED and CANCELED** accounts as problematic
- **API endpoint**: `/api/mcc-clients/unlink` for the actual unlinking
- **Data source**: `/api/mcc-clients/all` for fetching all accounts including suspended ones

---

**🚨 Note**: Due to a temporary dashboard integration issue, please use the direct URL above to access the unlink functionality. All backend features are fully functional!