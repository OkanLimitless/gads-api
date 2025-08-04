# 🔗 Access Account Unlink Functionality

## 🚀 Quick Access

Since the dashboard integration has temporary syntax issues, you can access the unlink functionality directly:

### **Method 1: Direct URL**
Navigate to:
```
/unlink-accounts?mccId=1284928552&mccName=Your%20MCC%20Name
```

### **Method 2: Add URL Bar Bookmark**
Bookmark this URL for quick access:
```
https://your-domain.com/unlink-accounts?mccId=1284928552&mccName=Your%20MCC%20Name
```

### **Method 3: Browser Console (Quick Test)**
Open browser console on your dashboard and run:
```javascript
window.location.href = '/unlink-accounts?mccId=1284928552&mccName=Your MCC Name';
```

## ✅ **WORKING FEATURES**

### **🔍 Suspended Account Detection**
- ✅ **Automatic detection** using `customer_client.status`
- ✅ **Visual highlighting** with red borders and warning badges
- ✅ **Filter buttons**: All, Suspended, Enabled accounts

### **🎯 Bulk Management**
- ✅ **Select All** functionality
- ✅ **Select All Suspended** for quick bulk selection
- ✅ **Individual checkboxes** for precise control

### **🛡️ Safe Operations**
- ✅ **Two-step confirmation** before unlinking
- ✅ **Clear warnings** about consequences
- ✅ **Individual results** for each account (success/failure)

### **🔧 Fixed API**
- ✅ **No more `mutate is not a function` errors**
- ✅ **Proper `mutateResources` implementation**
- ✅ **Correct Google Ads API structure**

## 🎯 **Perfect for Suspended Account Cleanup**

**Your workflow:**
1. **Navigate to**: `/unlink-accounts?mccId=1284928552`
2. **Filter**: Click "⚠️ Suspended" to see only suspended accounts
3. **Select**: Click "Select All Suspended" for bulk selection
4. **Unlink**: Click "Unlink Accounts" and confirm
5. **Review**: See detailed results for each account

## 📱 **Mobile Friendly**
The interface is fully responsive and works great on mobile devices too!

---

**🚨 Note**: The dashboard integration will be fixed in a future update. For now, use the direct URL method above - it's fully functional and ready for production use!